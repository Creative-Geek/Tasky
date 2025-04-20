// This script generates the favicon dynamically at runtime
export function generateFavicon() {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const size = 32; // Standard favicon size
  canvas.width = size;
  canvas.height = size;
  
  // Get the drawing context
  const ctx = canvas.getContext('2d');
  
  // Draw the rounded square background
  ctx.fillStyle = '#6366f1'; // Indigo-500 from Tailwind
  ctx.beginPath();
  const radius = 6; // Corner radius
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Draw the letter "T"
  ctx.fillStyle = '#ffffff'; // White text
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', size / 2, size / 2);
  
  // Convert to data URL and set as favicon
  const faviconUrl = canvas.toDataURL('image/png');
  
  // Set as favicon
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
  
  return faviconUrl;
}