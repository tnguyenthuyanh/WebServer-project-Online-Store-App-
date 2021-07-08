import * as FirebaseController from './firebase_controller.js'
import * as Util from '../viewpage/util.js'
import * as Constant from '../model/constant.js'
import * as Element from '../viewpage/element.js'
import { Product } from '../model/product.js';

let imageFile2Upload;

export function addEventListeners() {
    Element.formEditProduct.imageButton.addEventListener('change', e => {
        console.log('1st')
        imageFile2Upload = e.target.files[0];
        if (!imageFile2Upload) {
            Element.formEditProduct.imageTag.src = null;
            Element.formEditProduct.errorImage.innerHTML = 'Image change cancelled. The orginal image will be used';
            return;
        }
        Element.formEditProduct.errorImage.innerHTML = '';
        
        
        const reader = new FileReader();
        reader.readAsDataURL(imageFile2Upload);
        reader.onload = () => Element.formEditProduct.imageTag.src = reader.result;
    });

    Element.formEditProduct.form.addEventListener('submit', async e => {
        e.preventDefault();
        const button = e.target.getElementsByTagName('button')[0];
        const label = Util.disableButton(button);
        const p = new Product ({
            name: e.target.name.value,
            price: e.target.price.value,
            summary: e.target.summary.value,
            hide: Element.formEditProduct.hideCheckBox.value,
        });
        p.docId = e.target.docId.value;
        const errors = p.validate(true); //bypass image file check
        Element.formEditProduct.errorName.innerHTML = errors.name ? errors.name : '';
        Element.formEditProduct.errorPrice.innerHTML = errors.price ? errors.price : '';
        Element.formEditProduct.errorSummary.innerHTML = errors.summary ? errors.summary : '';

        if (Object.keys(errors).length != 0) {
            Util.enableButton(button, label);
            return;
        }

        try {
            if (imageFile2Upload) {
                const imageInfo = await FirebaseController.uploadImage(imageFile2Upload, e.target.imageName.value);
                p.imageURL = imageInfo.imageURL;
            }

            // update Firestore
            await FirebaseController.updateProduct(p);

            // update web browser
            const cardTag = document.getElementById('card-'+p.docId);
            if (imageFile2Upload) {
                cardTag.getElementsByTagName('img')[0].src = p.imageURL;
            }
            cardTag.getElementsByClassName('card-title')[0].innerHTML = p.name;
            cardTag.getElementsByClassName('card-text')[0].innerHTML = `$ ${p.price}<br>${p.summary}`;

            Util.info('Updated!', `${p.name} is updated successfully`, Element.modalEditProduct);

        } catch (e) {
            if (Constant.DEV) console.log(e);
            Util.info('Update product error', JSON.stringify(e), Element.modalEditProduct);
        }

        Util.enableButton(button, label)
    });
}

export async function edit_product(docId) {
    let product;
    try {
        product = await FirebaseController.getProductById(docId);
        if(!product) {
            Util.info('getProductById error', 'No product found by the id');
            return;
        }
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('getProductById Error', JSON.stringify(e));
        return;
    }

    //show product
    Element.formEditProduct.form.docId.value = product.docId;
    Element.formEditProduct.form.imageName.value = product.imageName;
    Element.formEditProduct.form.name.value = product.name;
    Element.formEditProduct.form.price.value = product.price;
    Element.formEditProduct.form.summary.value = product.summary;
    Element.formEditProduct.hideCheckBox.value = product.hide;
    if (product.hide == '1') 
        Element.formEditProduct.hideCheckBox.checked = true;
    else
        Element.formEditProduct.hideCheckBox.checked = false;
    Element.formEditProduct.imageTag.src = product.imageURL;
    Element.formEditProduct.errorImage.innerHTML = '';
    imageFile2Upload = null;
    Element.formEditProduct.imageButton.value = null;

    Element.modalEditProduct.show();
}

export async function delete_product(docId, imageName) {
    try {
        await FirebaseController.deleteProduct(docId, imageName);
        // Update browser
        const cardTag = document.getElementById('card-'+docId);
        cardTag.remove();

        Util.info('Deleted!', `${docId} has been deleted`);
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Delete product error', JSON.stringify(e));
    }
}