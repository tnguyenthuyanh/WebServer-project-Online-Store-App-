export class Product {
    constructor(data) {
        this.name = data.name.toLowerCase();
        this.price = typeof data.price == 'number' ? data.price : Number(data.price);
        this.summary = data.summary;
        this.imageName = data.imageName;
        this.imageURL = data.imageURL;
        this.qty = Number.isInteger(data.qty) ? data.qty : null;
    }

    serialize() {
        return {
            name: this.name,
            price: this.price,
            summary: this.summary,
            imageName: this.imageName,
            imageURL: this.imageURL,
            qty: this.qty,
        };
    }

    static isSerializedProduct(p) {
        if (!p.name) return false;
        if (!p.price || typeof p.price != 'number') return false;
        if (!p.summary) return false;
        if (!p.imageName) return false;
        if (!p.imageURL || !p.imageURL.includes('https')) return false;
        if (!p.qty || !Number.isInteger(p.qty)) return false;

        return true;
    }
}