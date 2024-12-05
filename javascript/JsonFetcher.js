class JsonFetcher {
    constructor(url) {
        this.url = url;
        this.data = null; // Hier speichern wir die geladenen Daten
    }

    async fetchData() {
        try {
            const response = await fetch(this.url, {
                method: 'POST' // Die Methode bleibt POST
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            this.data = data; // Daten im Fetcher-Objekt speichern
            console.log('Fetcher Daten erfolgreich gesetzt:', this.data);
            
            return this.data; // Rückgabe der Daten, falls es benötigt wird

        } catch (error) {
            console.error('Fehler beim Laden der JSON-Daten:', error);
            throw error;
        }
    }
}

export default JsonFetcher;
