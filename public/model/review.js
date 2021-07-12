export class Review {
    constructor(data) {
        this.productId = data.productId;
        this.uid = data.uid;
        this.email = data.email;
        this.timestamp = data.timestamp;
        this.content = data.content;
    }

    serialize() {
        return {
            productId: this.productId,
            uid: this.uid,
            email: this.email,
            timestamp: this.timestamp,
            content: this.content,
        }
    }
}