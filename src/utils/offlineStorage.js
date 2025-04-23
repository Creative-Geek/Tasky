/**
 * A utility for storing data offline and syncing it when the connection is restored
 */

// Check if the browser supports IndexedDB
const indexedDBSupported = typeof window !== 'undefined' && 'indexedDB' in window;

class OfflineStorage {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.syncInProgress = false;

    // Set up event listeners for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }

    // Initialize the database
    if (indexedDBSupported) {
      this.initDB();
    }
  }

  /**
   * Initialize the IndexedDB database
   */
  initDB() {
    const request = indexedDB.open('TaskyOfflineDB', 1);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('pendingOperations')) {
        const opStore = db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
        opStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      this.db = event.target.result;
      
      // Load pending operations from IndexedDB
      this.loadPendingOperations().then(() => {
        // If we're online, try to sync
        if (this.isOnline) {
          this.syncPendingOperations();
        }
      });
    };
  }

  /**
   * Handle the browser going online
   */
  handleOnline() {
    this.isOnline = true;
    this.syncPendingOperations();
  }

  /**
   * Handle the browser going offline
   */
  handleOffline() {
    this.isOnline = false;
  }

  /**
   * Load pending operations from IndexedDB
   */
  async loadPendingOperations() {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingOperations'], 'readonly');
      const store = transaction.objectStore('pendingOperations');
      const request = store.getAll();

      request.onsuccess = (event) => {
        this.pendingOperations = event.target.result;
        resolve(this.pendingOperations);
      };

      request.onerror = (event) => {
        console.error('Error loading pending operations:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Save a pending operation to IndexedDB
   * @param {Object} operation - The operation to save
   */
  async savePendingOperation(operation) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const request = store.add({
        ...operation,
        timestamp: Date.now(),
      });

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error saving pending operation:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Remove a pending operation from IndexedDB
   * @param {number} id - The ID of the operation to remove
   */
  async removePendingOperation(id) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const request = store.delete(id);

      request.onsuccess = (event) => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error removing pending operation:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Sync pending operations with the server
   */
  async syncPendingOperations() {
    if (this.syncInProgress || !this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    this.syncInProgress = true;

    // Sort operations by timestamp
    const sortedOperations = [...this.pendingOperations].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    for (const operation of sortedOperations) {
      try {
        // Execute the operation
        await operation.execute();
        
        // Remove the operation from IndexedDB
        await this.removePendingOperation(operation.id);
        
        // Remove the operation from the in-memory array
        this.pendingOperations = this.pendingOperations.filter(
          (op) => op.id !== operation.id
        );
      } catch (error) {
        console.error('Error syncing operation:', error);
        // If the operation fails, we'll try again later
      }
    }

    this.syncInProgress = false;
  }

  /**
   * Add a task to the offline storage
   * @param {Object} task - The task to add
   */
  async addTask(task) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.put(task);

      request.onsuccess = (event) => {
        resolve(task);
      };

      request.onerror = (event) => {
        console.error('Error adding task:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Get all tasks from the offline storage
   * @param {number} userId - The ID of the user whose tasks to get
   */
  async getTasks(userId) {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error getting tasks:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Update a task in the offline storage
   * @param {Object} task - The task to update
   */
  async updateTask(task) {
    return this.addTask(task);
  }

  /**
   * Delete a task from the offline storage
   * @param {number} taskId - The ID of the task to delete
   */
  async deleteTask(taskId) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.delete(taskId);

      request.onsuccess = (event) => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error deleting task:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Queue an operation to be executed when online
   * @param {Function} executeFn - The function to execute
   * @param {Object} rollbackData - Data needed to rollback the operation
   * @param {Function} rollbackFn - The function to execute to rollback
   */
  async queueOperation(executeFn, rollbackData, rollbackFn) {
    const operation = {
      execute: executeFn,
      rollbackData,
      rollback: rollbackFn,
      timestamp: Date.now(),
    };

    // Add to in-memory array
    this.pendingOperations.push(operation);

    // Save to IndexedDB
    if (this.db) {
      const id = await this.savePendingOperation(operation);
      operation.id = id;
    }

    // If we're online, try to sync
    if (this.isOnline && !this.syncInProgress) {
      this.syncPendingOperations();
    }

    return operation;
  }
}

// Create a singleton instance
const offlineStorage = new OfflineStorage();

export default offlineStorage;
