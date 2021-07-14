export class Saved {
    constructor(data) {
        this.productId = data.productId;
        this.name = data.name;
        this.uid = data.uid;
    }

    serialize() {
        return {
            productId: this.productId,
            name: this.name,
            uid: this.uid,
        }
    }
}