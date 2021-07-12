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
    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Protected Page</h1>';
        return;
    }
    if (!productId) {
        Util.info('Error', 'Product Id is null; invalid access');
        return;
    }

    let product;
    let reviews;
    try {
        product = await FirebaseController.getProductById(productId);
        if (!product) {
            Util.info('Error', 'Product does not exist');
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
            <img src="${product.imageURL}" width="400" height="400">
        </div>
        <div class="card" style="width: 500; height: 400px; margin-left: 80px; display:inline-block">
            <div class="card-header">${product.name}</div>
            <div class="card-body">
                <h5 class="card-subtitle mb-2" style="color: green;">Price: ${Util.currency(product.price)}</h5><hr>
                <p class="card-text">${product.summary}</p>
            </div>
        </div>
    </div>
    <hr>
    `;

    html += `
        <div id="message-review-body">
        <h5> Customer reviews </h5>
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

    // add new review
    html += `
        <div style="padding-top: 10px;"> 
            <textarea id="textarea-add-new-review" placeholder="Add a review"></textarea>
            <br>
            <button id="button-add-new-review" class="btn btn-outline-info">Add a Review</button>
        </div>
    `;

    Element.root.innerHTML = html;

    document.getElementById('button-add-new-review').addEventListener('click', async () => {
        const content = document.getElementById('textarea-add-new-review').value;
        const uid = Auth.currentUser.uid;
        const email = Auth.currentUser.email;
        const timestamp = Date.now();
        const review = new Review({
            uid, email, timestamp, content, productId,
        });

        const button = document.getElementById('button-add-new-review');
        const label = Util.disableButton(button);
        // await Util.sleep(1000);

        try {
            const docId = await FirebaseController.addReview(review);
            review.docId = docId;
        } catch (e) {
            if (Constant.DEV) console.log(e);
            Util.info('Error', JSON.stringify(e));
        }

        const reviewTag = document.createElement('div');
        reviewTag.innerHTML = buildReviewView(review);
        document.getElementById('message-review-body').appendChild(reviewTag);
        document.getElementById('textarea-add-new-review').value = '';

        Util.enableButton(button, label);
    });

    const formEditReview = document.getElementsByClassName('form-edit-review');
    for (let i = 0; i < formEditReview.length; i++) {
        formEditReview[i].addEventListener('submit', async e => {
            e.preventDefault();
            const docId = e.target.docId.value;
            document.getElementById(`review-${docId}-content`).disabled = false;
        });
    }

    const formDeleteReview = document.getElementsByClassName('form-delete-review');
    for (let i = 0; i < formDeleteReview.length; i++) {
        formDeleteReview[i].addEventListener('submit', async e => {
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
}

function buildReviewView(review) {
    let html = `
    <div id="${review.docId}-box" class="border border-primary" style="margin-top: 15px;">
        <div class="text-white" style="background-color: pink">
            Reviewed by ${review.email} (At ${new Date(review.timestamp).toString()})
        </div>
        <input id="review-${review.docId}-content" name="content" value="${review.content}" disabled>
    `;
    if (review.uid == Auth.currentUser.uid)
        html += `
            <form class="form-edit-review" method="post" style="display:inline-block; padding: 0 0 7px 7px">
                <input type="hidden" name="docId" value="${review.docId}">
                <button class="btn btn-outline-primary" type="submit">Edit</button>
            </form>
            <form class="form-delete-review" method="post" style="display:inline-block;">
                <input type="hidden" name="docId" value="${review.docId}">
                <button class="btn btn-outline-danger" type="submit">Delete</button>
            </form> 
        `;

    html += '</div>';
    return html;
}