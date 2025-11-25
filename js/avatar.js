/**
 * 🎨 Avatar Generator (Identicon)
 * Generates unique visual identities for Bitcoin addresses
 */

class AvatarGenerator {
    /**
     * Generate identicon SVG from address
     * @param {string} address - Bitcoin address
     * @param {number} size - Size in pixels (default: 64)
     * @returns {string} SVG string
     */
    static generateIdenticon(address, size = 64) {
        // Create hash from address
        const hash = this.hashAddress(address);
        
        // Generate color from hash
        const hue = parseInt(hash.substring(0, 3), 16) % 360;
        const saturation = 50 + (parseInt(hash.substring(3, 5), 16) % 30);
        const lightness = 40 + (parseInt(hash.substring(5, 7), 16) % 25);
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Create 5x5 grid (symmetric)
        const grid = this.generateGrid(hash);
        const cellSize = size / 5;
        
        // Build SVG
        let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="${size}" height="${size}" fill="#f0f0f0"/>`;
        
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                if (grid[y][x]) {
                    svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
                }
            }
        }
        
        svg += '</svg>';
        
        return svg;
    }
    
    /**
     * Generate robohash-style avatar
     * @param {string} address - Bitcoin address
     * @param {number} size - Size in pixels
     * @returns {string} SVG string
     */
    static generateRobohash(address, size = 64) {
        const hash = this.hashAddress(address);
        
        // Generate colors
        const bodyHue = parseInt(hash.substring(0, 3), 16) % 360;
        const headHue = parseInt(hash.substring(3, 6), 16) % 360;
        const eyeHue = parseInt(hash.substring(6, 9), 16) % 360;
        
        const bodyColor = `hsl(${bodyHue}, 60%, 50%)`;
        const headColor = `hsl(${headHue}, 70%, 45%)`;
        const eyeColor = `hsl(${eyeHue}, 80%, 60%)`;
        
        // Robot shape variations based on hash
        const bodyShape = parseInt(hash.substring(9, 11), 16) % 3;
        const headShape = parseInt(hash.substring(11, 13), 16) % 3;
        const eyeShape = parseInt(hash.substring(13, 15), 16) % 2;
        
        let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">`;
        svg += `<rect width="100" height="100" fill="#f5f5f5"/>`;
        
        // Body
        if (bodyShape === 0) {
            svg += `<rect x="20" y="50" width="60" height="40" rx="5" fill="${bodyColor}"/>`;
        } else if (bodyShape === 1) {
            svg += `<ellipse cx="50" cy="70" rx="30" ry="20" fill="${bodyColor}"/>`;
        } else {
            svg += `<polygon points="20,90 50,50 80,90" fill="${bodyColor}"/>`;
        }
        
        // Head
        if (headShape === 0) {
            svg += `<rect x="30" y="20" width="40" height="40" rx="8" fill="${headColor}"/>`;
        } else if (headShape === 1) {
            svg += `<circle cx="50" cy="40" r="20" fill="${headColor}"/>`;
        } else {
            svg += `<rect x="30" y="20" width="40" height="35" rx="20" fill="${headColor}"/>`;
        }
        
        // Eyes
        if (eyeShape === 0) {
            svg += `<circle cx="40" cy="35" r="4" fill="${eyeColor}"/>`;
            svg += `<circle cx="60" cy="35" r="4" fill="${eyeColor}"/>`;
        } else {
            svg += `<rect x="37" y="33" width="6" height="4" fill="${eyeColor}"/>`;
            svg += `<rect x="57" y="33" width="6" height="4" fill="${eyeColor}"/>`;
        }
        
        // Antenna
        svg += `<line x1="50" y1="20" x2="50" y2="10" stroke="${headColor}" stroke-width="2"/>`;
        svg += `<circle cx="50" cy="10" r="3" fill="${eyeColor}"/>`;
        
        svg += '</svg>';
        
        return svg;
    }
    
    /**
     * Generate Bitcoin-themed avatar
     * @param {string} address - Bitcoin address
     * @param {number} size - Size in pixels
     * @returns {string} SVG string
     */
    static generateBitcoinAvatar(address, size = 64) {
        const hash = this.hashAddress(address);
        
        // Generate gradient colors
        const hue1 = parseInt(hash.substring(0, 3), 16) % 360;
        const hue2 = (hue1 + 60) % 360;
        
        const color1 = `hsl(${hue1}, 70%, 50%)`;
        const color2 = `hsl(${hue2}, 70%, 40%)`;
        
        // Pattern style
        const pattern = parseInt(hash.substring(3, 5), 16) % 4;
        
        let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">`;
        
        // Gradient background
        svg += `<defs>
            <linearGradient id="grad-${hash.substring(0, 8)}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
            </linearGradient>
        </defs>`;
        
        svg += `<circle cx="50" cy="50" r="50" fill="url(#grad-${hash.substring(0, 8)})"/>`;
        
        // Bitcoin symbol variation
        if (pattern === 0) {
            // Classic ₿
            svg += `<text x="50" y="65" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">₿</text>`;
        } else if (pattern === 1) {
            // Sats symbol
            svg += `<text x="50" y="65" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle">⚡</text>`;
        } else if (pattern === 2) {
            // Block pattern
            svg += `<rect x="30" y="30" width="15" height="15" fill="rgba(255,255,255,0.8)"/>`;
            svg += `<rect x="55" y="30" width="15" height="15" fill="rgba(255,255,255,0.6)"/>`;
            svg += `<rect x="30" y="55" width="15" height="15" fill="rgba(255,255,255,0.6)"/>`;
            svg += `<rect x="55" y="55" width="15" height="15" fill="rgba(255,255,255,0.8)"/>`;
        } else {
            // Hash pattern
            svg += `<text x="50" y="65" font-family="monospace" font-size="35" font-weight="bold" fill="white" text-anchor="middle">#</text>`;
        }
        
        svg += '</svg>';
        
        return svg;
    }
    
    /**
     * Get avatar as data URL
     * @param {string} address - Bitcoin address
     * @param {string} style - Avatar style (identicon, robohash, bitcoin)
     * @param {number} size - Size in pixels
     * @returns {string} Data URL
     */
    static getAvatarDataURL(address, style = 'identicon', size = 64) {
        let svg;
        
        switch (style) {
            case 'robohash':
                svg = this.generateRobohash(address, size);
                break;
            case 'bitcoin':
                svg = this.generateBitcoinAvatar(address, size);
                break;
            case 'identicon':
            default:
                svg = this.generateIdenticon(address, size);
                break;
        }
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
    
    /**
     * Hash address for consistent randomness
     * @param {string} address - Bitcoin address
     * @returns {string} Hex hash
     */
    static hashAddress(address) {
        // Simple hash function (SHA-256 would be better but this works)
        let hash = 0;
        for (let i = 0; i < address.length; i++) {
            const char = address.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Convert to hex and pad
        return Math.abs(hash).toString(16).padStart(16, '0');
    }
    
    /**
     * Generate symmetric grid for identicon
     * @param {string} hash - Hash string
     * @returns {Array<Array<boolean>>} 5x5 grid
     */
    static generateGrid(hash) {
        const grid = [];
        
        for (let y = 0; y < 5; y++) {
            grid[y] = [];
            for (let x = 0; x < 5; x++) {
                // Use left side for right (symmetric)
                const mirrorX = x < 3 ? x : 4 - x;
                const index = y * 3 + mirrorX;
                const value = parseInt(hash.charAt(index % hash.length), 16);
                grid[y][x] = value % 2 === 0;
            }
        }
        
        return grid;
    }
    
    /**
     * Create avatar element
     * @param {string} address - Bitcoin address
     * @param {string} style - Avatar style
     * @param {number} size - Size in pixels
     * @returns {HTMLImageElement} Image element
     */
    static createAvatarElement(address, style = 'identicon', size = 64) {
        const img = document.createElement('img');
        img.src = this.getAvatarDataURL(address, style, size);
        img.width = size;
        img.height = size;
        img.alt = `Avatar for ${address.substring(0, 8)}...`;
        img.style.borderRadius = '50%';
        img.style.border = '2px solid #ddd';
        return img;
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.AvatarGenerator = AvatarGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarGenerator;
}

