/**
 * A utility for managing API requests, with support for:
 * - Request queuing
 * - Automatic retries
 * - Request batching
 * - Request cancellation
 */

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchTimeoutId = null;
    this.batchInterval = 300; // ms to wait before processing batched requests
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms to wait before retrying
  }

  /**
   * Add a request to the queue
   * @param {Function} requestFn - The function that makes the API call
   * @param {Object} options - Options for the request
   * @param {string} options.id - Unique identifier for the request
   * @param {boolean} options.batch - Whether this request can be batched
   * @param {Function} options.onSuccess - Callback for successful requests
   * @param {Function} options.onError - Callback for failed requests
   * @param {number} options.priority - Priority of the request (lower is higher priority)
   * @returns {Promise} A promise that resolves when the request is complete
   */
  enqueue(requestFn, options = {}) {
    const {
      id = Date.now().toString(),
      batch = false,
      onSuccess = () => {},
      onError = () => {},
      priority = 5,
      retries = 0,
    } = options;

    // Create a promise that will be resolved when the request is complete
    return new Promise((resolve, reject) => {
      // Check if there's already a request with this ID in the queue
      const existingRequestIndex = this.queue.findIndex(
        (item) => item.id === id
      );

      // If there is, replace it
      if (existingRequestIndex !== -1) {
        this.queue[existingRequestIndex] = {
          id,
          requestFn,
          batch,
          priority,
          retries,
          resolve,
          reject,
          onSuccess,
          onError,
        };
      } else {
        // Otherwise, add it to the queue
        this.queue.push({
          id,
          requestFn,
          batch,
          priority,
          retries,
          resolve,
          reject,
          onSuccess,
          onError,
        });
      }

      // Sort the queue by priority
      this.queue.sort((a, b) => a.priority - b.priority);

      // If this request can be batched, set a timeout to process the queue
      if (batch) {
        if (this.batchTimeoutId) {
          clearTimeout(this.batchTimeoutId);
        }
        this.batchTimeoutId = setTimeout(() => {
          this.processQueue();
        }, this.batchInterval);
      } else {
        // Otherwise, process the queue immediately
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue of requests
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    // Group batchable requests together
    const batchableRequests = this.queue.filter((item) => item.batch);
    const nonBatchableRequests = this.queue.filter((item) => !item.batch);

    // Process non-batchable requests first
    for (const request of nonBatchableRequests) {
      try {
        const result = await request.requestFn();
        request.resolve(result);
        request.onSuccess(result);
        this.queue = this.queue.filter((item) => item.id !== request.id);
      } catch (error) {
        if (request.retries < this.maxRetries) {
          // Retry the request
          this.queue = this.queue.filter((item) => item.id !== request.id);
          setTimeout(() => {
            this.enqueue(request.requestFn, {
              ...request,
              retries: request.retries + 1,
            });
          }, this.retryDelay * (request.retries + 1));
        } else {
          request.reject(error);
          request.onError(error);
          this.queue = this.queue.filter((item) => item.id !== request.id);
        }
      }
    }

    // Process batchable requests if there are any
    if (batchableRequests.length > 0) {
      // This is where you would implement batching logic
      // For now, we'll just process them individually
      for (const request of batchableRequests) {
        try {
          const result = await request.requestFn();
          request.resolve(result);
          request.onSuccess(result);
          this.queue = this.queue.filter((item) => item.id !== request.id);
        } catch (error) {
          if (request.retries < this.maxRetries) {
            // Retry the request
            this.queue = this.queue.filter((item) => item.id !== request.id);
            setTimeout(() => {
              this.enqueue(request.requestFn, {
                ...request,
                retries: request.retries + 1,
              });
            }, this.retryDelay * (request.retries + 1));
          } else {
            request.reject(error);
            request.onError(error);
            this.queue = this.queue.filter((item) => item.id !== request.id);
          }
        }
      }
    }

    this.processing = false;

    // If there are still items in the queue, process them
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Cancel a request by ID
   * @param {string} id - The ID of the request to cancel
   */
  cancel(id) {
    this.queue = this.queue.filter((item) => item.id !== id);
  }

  /**
   * Cancel all requests
   */
  cancelAll() {
    this.queue = [];
  }
}

// Create a singleton instance
const requestQueue = new RequestQueue();

export default requestQueue;
