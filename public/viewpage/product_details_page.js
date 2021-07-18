import * as Auth from '../controller/auth.js'
import * as Element from './element.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Util from './util.js'
import * as Constant from '../model/constant.js'
import { Review } from '../model/review.js'
import * as Route from '../controller/route.js'

export function addViewButtonListeners() {
    const viewButtonForms = document.getElementsByClassName('form-view-detail');
    for (let i = 0; i < viewButtonForms.length; i++) {
        addViewFormSubmitEvent(viewButtonForms[i]);
    }

}

export function addViewFormSubmitEvent(form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const button = e.target.getElementsByTagName('button')[0];
        const label = Util.disableButton(button);

        const productId = e.target.productId.value;
        history.pushState(null, null, Route.routePathnames.ITEM + '#' + productId);
        await product_details_page(productId);
        Util.enableButton(button, label);
    });
}

export async function product_details_page(productId) {
    if (!productId) {
        Util.info('Error', 'Product Id is null; invalid access');
        return;
    }

    let product;
    let reviews;
    try {
        product = await FirebaseController.getProductById(productId);
        if (!product || product.hide == '1') {
            Util.info('Error', 'Product does not exist or you are not allowed to access');
            return;
        }

        reviews = await FirebaseController.getReviewList(productId);
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Error', JSON.stringify(e));
        return;
    }

    let html = `
    <div style="text-align: center;">
        <div style="display:inline-block; vertical-align:top;">
            <img src="${product.imageURL}" width="300" height="300">
        </div>
        <div class="card" style="width: 45rem; height: 300px; margin-left: 60px; display:inline-block">
            <div class="card-header">${product.name}</div>
            <div class="card-body">
                <h5 class="card-subtitle mb-2" style="color: green;">Price: ${Util.currency(product.price)}</h5><hr>
                <p class="card-text">${product.summary}</p>
            </div>
        </div>
    </div>
    <hr>
    `;

    let bought = false;

    if (Auth.currentUser) {
        const carts = await FirebaseController.getPurchaseHistory(Auth.currentUser.uid);

        for (let i = 0; i < carts.length; i++) {
            const p = carts[i].items.find(i => i.docId == productId);
            if (p) {
                bought = true;
                break;
            }
        }
    }

    // add new review
    html += `
        <h5> Customer reviews </h5>
        <div class="${Auth.currentUser && (bought || Constant.adminEmails.includes(Auth.currentUser.email))
            ? 'd-block' : 'd-none'}" style="padding-top: 10px;"> 
            <textarea id="textarea-add-new-review" placeholder="Add a review"></textarea>
            <p id="form-add-review-error" class="my-error"></p>
            <button id="button-add-new-review" class="btn btn-outline-info">Add a Review</button>
        </div> 
    `;
    

    html += `
        <div id="message-review-body">
        `;

    // display all reviews
    if (reviews && reviews.length > 0) {
        reviews.forEach(r => {
            html += buildReviewView(r);
        });
    }
    // else 
    //     html += "There are no customer reviews yet.";
    html += '</div>';

    Element.root.innerHTML = html;

    document.getElementById('button-add-new-review').addEventListener('click', async () => {
        const content = document.getElementById('textarea-add-new-review').value;
        const uid = Auth.currentUser.uid;
        const email = Auth.currentUser.email;
        const timestamp = Date.now();
        const review = new Review({
            uid, email, timestamp, content, productId,
        });

        const error = review.validate();
        if (error) {
            document.getElementById('form-add-review-error').innerHTML = error;
            return;
        }
        document.getElementById('form-add-review-error').innerHTML = '';
            
        const button = document.getElementById('button-add-new-review');
        const label = Util.disableButton(button);

        try {
            const docId = await FirebaseController.addReview(review);
            review.docId = docId;
        } catch (e) {
            if (Constant.DEV) console.log(e);
            Util.info('Error', JSON.stringify(e));
        }

        const reviewTag = document.createElement('div');
        reviewTag.innerHTML = buildReviewView(review);
        document.getElementById('message-review-body').prepend(reviewTag);
        document.getElementById('textarea-add-new-review').value = '';
        const editForm = document.getElementsByClassName('form-edit-review');
        addEditReviewFormEvent(editForm[0]);
        const updateForm = document.getElementsByClassName('form-update-review');
        addUpdateReviewFormEvent(updateForm[0]);
        const deleteForm = document.getElementsByClassName('form-delete-review');
        addDeleteReviewFormEvent(deleteForm[0]);
        Util.enableButton(button, label);
    });

    const formEditReview = document.getElementsByClassName('form-edit-review');
    for (let i = 0; i < formEditReview.length; i++) {
        addEditReviewFormEvent(formEditReview[i]);
    }

    const formUpdateReview = document.getElementsByClassName('form-update-review');
    for (let i = 0; i < formUpdateReview.length; i++) {
        addUpdateReviewFormEvent(formUpdateReview[i]);
    }

    const formDeleteReview = document.getElementsByClassName('form-delete-review');
    for (let i = 0; i < formDeleteReview.length; i++) {
        addDeleteReviewFormEvent(formDeleteReview[i]);
    }
}

function addEditReviewFormEvent(form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        const docId = e.target.docId.value;
        const button = e.target.getElementsByTagName('button')[0];
        const updateForm = document.getElementById(`update-${docId}`);
        const orgContentInput = document.getElementById(`review-${docId}-content`);
        const orgContent = e.target.content.value;
        if (button.innerHTML == 'Edit') {
            orgContentInput.disabled = false;
            updateForm.style.display = 'inline-block';
            button.innerHTML = 'Cancel';
        }
        else {
            orgContentInput.disabled = true;
            updateForm.style.display = 'none';
            orgContentInput.value = orgContent;
            document.getElementById(`update-review-${docId}-error`).innerHTML = '';
            button.innerHTML = 'Edit';
        }
    });
}

function addUpdateReviewFormEvent(form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const button = e.target.getElementsByTagName('button')[0];
        const docId = e.target.docId.value;
        const errorTag = document.getElementById(`update-review-${docId}-error`);
        const content = document.getElementById(`review-${docId}-content`).value;
        const timestamp = Date.now();
        if (!content || content.length < 6) {
            errorTag.innerHTML = 'Review too short; min 6 chars';
            return;
        }
        errorTag.innerHTML = '';
        const label = Util.disableButton(button);
        try {
            await FirebaseController.updateReview(docId, { content, timestamp });
            document.getElementById(`edit-input-content-${docId}`).value = content;
            document.getElementById(`review-${docId}-content`).disabled = true;
            document.getElementById(`time-${docId}`).innerHTML = `(At ${new Date(timestamp).toString()})`;
            document.getElementById(`edit-button-${docId}`).innerHTML = 'Edit';
            document.getElementById(`update-${docId}`).style.display = 'none';
            const updatedReviewBox = document.getElementById(`${docId}-box`);
            document.getElementById(`${docId}-box`).remove();
            document.getElementById('message-review-body').prepend(updatedReviewBox);
        } catch (e) {
            if (Constant.DEV) console.log(e);
            Util.info('Update review in Error', JSON.stringify(e));
        }
        Util.enableButton(button, label);
    });
}

function addDeleteReviewFormEvent(form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!window.confirm("Press OK to delete.")) return;
        const button = e.target.getElementsByTagName('button')[0];
        Util.disableButton(button);
        const docId = e.target.docId.value;
        try {
            await FirebaseController.deleteReview(docId);
            document.getElementById(`${docId}-box`).remove();
            //Util.info('Deleted!', 'Review deleted');
        } catch (e) {
            if (Constant.DEV) console.log(e);
            Util.info('Delete review in Error', JSON.stringify(e));
        }
    });
}

function buildReviewView(review) {
    let html = `
    <div id="${review.docId}-box" class="border border-primary" style="margin-top: 15px;">
        <div class="text-black" style="background-color: pink">
            Reviewed by ${review.email} <span id="time-${review.docId}">(At ${new Date(review.timestamp).toString()})</span>
        </div>
        <input id="review-${review.docId}-content" name="content" value="${review.content}" disabled>
        <p id="update-review-${review.docId}-error" class="my-error"></p>
    `;

    if (Auth.currentUser && review.uid == Auth.currentUser.uid)
        html += `
            <form class="form-edit-review" method="post" style="display: inline-block; padding: 0 0 7px 7px">
                <input type="hidden" name="docId" value="${review.docId}">
                <input id="edit-input-content-${review.docId}" type="hidden" name="content" value="${review.content}">
                <button id="edit-button-${review.docId}" edit-review-button" class="btn btn-outline-primary" type="submit">Edit</button>
            </form>
            <form id="update-${review.docId}" class="form-update-review" method="post" style="display: none; padding-left: 8px">
                <input type="hidden" name="docId" value="${review.docId}">
                <button class="btn btn-outline-success" type="submit">Update</button>
            </form>
            <form class="form-delete-review" method="post" style="display:inline-block; padding-left: 8px">
                <input type="hidden" name="docId" value="${review.docId}">
                <button class="btn btn-outline-danger" type="submit">Delete</button>
            </form> 
        `;
    else if (Auth.currentUser && Constant.adminEmails.includes(Auth.currentUser.email))
        html += `
            <form class="form-delete-review" method="post" style="display:inline-block; padding: 0 0 7px 7px">
                <input type="hidden" name="docId" value="${review.docId}">
                <button class="btn btn-outline-danger" type="submit">Delete</button>
            </form> 
        `;

    html += '</div>';
    return html;
}