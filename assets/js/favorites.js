// Favorites Management System
const Favorites = {
    getKey: () => 'tools_dz_favorites',

    getAll: function() {
        try {
            const data = localStorage.getItem(this.getKey());
            const favorites = data ? JSON.parse(data) : [];
            return Array.isArray(favorites)
                ? favorites.filter(id => typeof id === 'string')
                : [];
        } catch (error) {
            console.warn('Could not read favorites from localStorage', error);
            return [];
        }
    },

    add: function(toolId) {
        let favs = this.getAll();
        if (!favs.includes(toolId)) {
            favs.push(toolId);
            localStorage.setItem(this.getKey(), JSON.stringify(favs));
        }
    },

    remove: function(toolId) {
        let favs = this.getAll();
        favs = favs.filter(id => id !== toolId);
        localStorage.setItem(this.getKey(), JSON.stringify(favs));
    },

    isFavorite: function(toolId) {
        return this.getAll().includes(toolId);
    },

    toggle: function(toolId) {
        if (this.isFavorite(toolId)) {
            this.remove(toolId);
            return false;
        } else {
            this.add(toolId);
            return true;
        }
    }
};

// Expose the API globally because tools.js uses window.Favorites.
window.Favorites = Favorites;
