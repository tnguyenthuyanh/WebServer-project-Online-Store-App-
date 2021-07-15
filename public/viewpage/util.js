import * as Element from './element.js'

export function info(title, body, closeModal) {
    if (closeModal) closeModal.hide();
    Element.modalInfoTitle.innerHTML = title;
    Element.modalInfoBody.innerHTML = body;
    Element.modalInfo.show();
}

export function currency(money) {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(money);
}

export function disableButton(button) {
    button.disabled = true;
    const label = button.innerHTML;
    button.innerHTML = "Wait...";
    return label;
}

export function enableButton(button, label) {
    if (label) button.innerHTML = label;
    button.disabled = false;
}

export function switchSavedButton(button, isSaved) {
    if (isSaved) { 
        button.innerHTML = '<img src="images/star-saved.png" class="rounded-circle" height="30px">';
        button.value = "saved";
    }
    else { // <a href="https://www.freeiconspng.com/img/13226">Icon Free White Star</a>
        button.innerHTML = '<img src="images/star-unsave.png" class="rounded-circle" height="30px">';
        button.value = "unsave";
    }
}

// https://www.sitepoint.com/delay-sleep-pause-wait/
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}