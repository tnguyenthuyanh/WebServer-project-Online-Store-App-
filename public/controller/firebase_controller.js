import { AccountInfo } from '../model/account_info.js';
import * as Constant from '../model/constant.js'
import { Product } from '../model/Product.js';
import { Review } from '../model/review.js';
import { Saved } from '../model/saved.js';
import { ShoppingCart } from '../model/ShoppingCart.js';
import * as Auth from './auth.js'

export async function signIn(email, password) {
    await firebase.auth().signInWithEmailAndPassword(email, password);
}

export async function signOut() {
    await firebase.auth().signOut();
}

export async function updateAccount(newPassword) {
    await firebase.auth().currentUser.updatePassword(newPassword)
}

export async function getProductList() {
    const products = [];
    const snapShot = await firebase.firestore().collection(Constant.collectionNames.PRODUCTS)
        .where('hide', '!=', '1')
        .orderBy('hide')
        .get();
    snapShot.forEach(doc => {
        const p = new Product(doc.data());
        p.docId = doc.id;
        products.push(p);
    });
    return products;
}

const cf_getProductListByAdmin = firebase.functions().httpsCallable('cf_getProductListByAdmin')
export async function getProductListByAdmin() {
    const products = [];
    const result = await cf_getProductListByAdmin();
    result.data.forEach(data => {
        const p = new Product(data);
        p.docId = data.docId;
        products.push(p);
    });
    return products;
}

export async function checkOut(cart) {
    const data = cart.serialize(Date.now());
    await firebase.firestore().collection(Constant.collectionNames.PURCHASE_HISTORY)
        .add(data);
}

export async function getPurchaseHistory(uid) {
    const snapShot = await firebase.firestore().collection(Constant.collectionNames.PURCHASE_HISTORY)
        .where('uid', '==', uid)
        .orderBy('timestamp', 'desc')
        .get();
    const carts = [];
    snapShot.forEach(doc => {
        const sc = ShoppingCart.deserialize(doc.data());
        sc.docId = doc.id;
        carts.push(sc);
    });
    return carts;
}

export async function createUser(email, password) {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
}

export async function getAccountInfo(uid) {
    const doc = await firebase.firestore().collection(Constant.collectionNames.ACCOUNT_INFO)
        .doc(uid).get();
    if (doc.exists) {
        return new AccountInfo(doc.data());
    } else {
        const defaultInfo = AccountInfo.instance();
        await firebase.firestore().collection(Constant.collectionNames.ACCOUNT_INFO)
            .doc(uid).set(defaultInfo.serialize());
        return defaultInfo;
    }
}

export async function updateAccountInfo(uid, updateInfo) {
    // updateInfo = {key: value}
    await firebase.firestore().collection(Constant.collectionNames.ACCOUNT_INFO)
        .doc(uid).update(updateInfo);
}

export async function uploadProfilePhoto(photoFile, imageName) {
    const ref = firebase.storage().ref()
        .child(Constant.storageFolderNames.PROFILE_PHOTOS + imageName)
    const taskSnapShot = await ref.put(photoFile);
    const photoURL = await taskSnapShot.ref.getDownloadURL();
    return photoURL;
}

const cf_addProduct = firebase.functions().httpsCallable('cf_addProduct')
export async function addProduct(product) {
    await cf_addProduct(product);
}

export async function getProductById(docId) {
    const doc = await firebase.firestore().collection(Constant.collectionNames.PRODUCTS)
        .doc(docId).get();
    if (doc.exists) {
        const p = new Product(doc.data());
        p.docId = doc.id;
        return p;
    }
}


const cf_updateProduct = firebase.functions().httpsCallable('cf_updateProduct');
export async function updateProduct(product) {
    const docId = product.docId;
    const data = product.serializeForUpdate();
    await cf_updateProduct({ docId, data });

    if (product.hide == '1')
        deleteSavedProducts(docId);

}

const cf_deleteProduct = firebase.functions().httpsCallable('cf_deleteProduct');
export async function deleteProduct(docId, imageName) {
    await cf_deleteProduct(docId);
    const ref = firebase.storage().ref()
        .child(Constant.storageFolderNames.PRODUCT_IMAGES + imageName);
    await ref.delete();
    
    deleteSavedProducts(docId);
    
}

async function deleteSavedProducts(productId) {
    // delete all productId in saved_products
    const product = await firebase.firestore().collection(Constant.collectionNames.SAVED_PRODUCTS)
    .where('productId', '==', productId)
    .get();

    for (let i = 0; i < product.size; i++) {
        await firebase.firestore().collection(Constant.collectionNames.SAVED_PRODUCTS).doc(product.docs[i].id).delete();
    }
}

const cf_getUserList = firebase.functions().httpsCallable('cf_getUserList');
export async function getUserList() {
    const result = await cf_getUserList();
    return result.data;
}

const cf_updateUser = firebase.functions().httpsCallable('cf_updateUser');
export async function updateUser(uid, update) {
    await cf_updateUser({ uid, update });
}

const cf_deleteUser = firebase.functions().httpsCallable('cf_deleteUser');
export async function deleteUser(uid) {
    await cf_deleteUser(uid);
}

export async function uploadImage(imageFile, imageName) {
    if (!imageName)
        imageName = Date.now() + imageFile.name; // with default name when stored in computer

    const ref = firebase.storage().ref()
        .child(Constant.storageFolderNames.PRODUCT_IMAGES + imageName);
    const taskSnapShot = await ref.put(imageFile);
    const imageURL = await taskSnapShot.ref.getDownloadURL();
    return { imageName, imageURL };
}


const cf_deletePurchaseHistory = firebase.functions().httpsCallable('cf_deletePurchaseHistory');
export async function deletePurchaseHistory(docId) {
    await cf_deletePurchaseHistory(docId);
}

export async function getReviewList(productId) {
    const snapShot = await firebase.firestore()
            .collection(Constant.collectionNames.REVIEW)
            .where('productId', '==', productId)
            .orderBy('timestamp', 'desc')
            .get();
    const reviews = [];
    snapShot.forEach(doc => {
        const r = new Review(doc.data());
        r.docId = doc.id;
        reviews.push(r);
    });

    return reviews;
}

export async function addReview(review) {
    const ref = await firebase.firestore()
            .collection(Constant.collectionNames.REVIEW)
            .add(review.serialize());
    return ref.id;
}

const cf_deleteReview = firebase.functions().httpsCallable('cf_deleteReview');
export async function deleteReview(docId) {
    const email = Auth.currentUser.email;
    await cf_deleteReview({docId, email});
}

export async function updateReview(docId, data) {
    await firebase.firestore().collection(Constant.collectionNames.REVIEW)
                    .doc(docId).update(data);
}

export async function getSavedList() {
    let productList = [];
    const snapShot = await firebase.firestore()
            .collection(Constant.collectionNames.SAVED_PRODUCTS)
            .where('uid', '==', Auth.currentUser.uid)
            .get();
    
    snapShot.forEach(doc => {
        const t = new Saved(doc.data());
        t.docId = doc.id;
        productList.push(t);
    });
    return productList;
}

export async function saveProduct(product) {
    const ref = await firebase.firestore()
            .collection(Constant.collectionNames.SAVED_PRODUCTS)
            .add(product.serialize());
}

export async function unsaveProduct(productId) {
    const product = await firebase.firestore().collection(Constant.collectionNames.SAVED_PRODUCTS)
            .where('productId', '==', productId)
            .where('uid', '==', Auth.currentUser.uid)
            .get();
    
    await firebase.firestore().collection(Constant.collectionNames.SAVED_PRODUCTS).doc(product.docs[0].id).delete()
                .then(function (docRef) {
                    console.log("Successfully deleted from Saved_Product collection!");
                }).catch(function (e) {
                    console.error("Error deleting", e);
                });
}


export async function sortProduct(option) {
    const productList = [];
    let snapShot;
    if (option == 'Name: Z-A') {
        snapShot = await firebase.firestore()
            .collection(Constant.collectionNames.PRODUCTS)
            .orderBy('name', 'desc')
            .get();
    }
    else if (option == 'Name: A-Z') {
        snapShot = await firebase.firestore()
            .collection(Constant.collectionNames.PRODUCTS)
            .orderBy('name')
            .get();
    } 
    else if (option == 'Price: highest first') {
        snapShot = await firebase.firestore()
            .collection(Constant.collectionNames.PRODUCTS)
            .orderBy('price', 'desc')
            .get();
    } 
    else if (option == 'Price: lowest first') {
        snapShot = await firebase.firestore()
            .collection(Constant.collectionNames.PRODUCTS)
            .orderBy('price')
            .get();
    } 

    for (let i = 0; i < snapShot.size; i++) {
        if (snapShot.docs[i].data().hide == 1)
            continue;
        const t = new Product(snapShot.docs[i].data());
        t.docId = snapShot.docs[i].id;
        productList.push(t);
    }

    return productList;
}

export function deleteAccount() {
    firebase.auth().currentUser.delete();
}