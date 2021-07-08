import * as Element from './element.js'
import * as Home from './home_page.js';
import * as Product from './product_page.js'
import * as Util from './util.js'

export function addEventListeners() {
    Element.menuViewAsCustomer.addEventListener('click', async e => {
        let elements;
        const viewAsUserLabel = 'View as Customer';
        const backToAdminPageLabel = 'Back to Admin Page'; 
        if (e.target.innerHTML == viewAsUserLabel) {
            Util.disableButton(e.target);
            elements = document.getElementsByClassName('admin');
            for (let i = 0; i < elements.length; i++) {
                elements[i].style.display = 'none';
            }
            elements = document.getElementsByClassName('user');
            for (let i = 0; i < elements.length; i++) {
                elements[i].style.display = 'block';
            }
            Element.menuViewAsCustomer.style.display = 'block';  
            await Home.home_page();
            Util.enableButton(e.target, backToAdminPageLabel);
        } 
        else {
            Util.disableButton(e.target);
            elements = document.getElementsByClassName('admin');
            for (let i = 0; i < elements.length; i++) {
                elements[i].style.display = 'block';
            }
            elements = document.getElementsByClassName('user');
            for (let i = 0; i < elements.length; i++) {
                elements[i].style.display = 'none';
            }
            await Product.product_page();
            Util.enableButton(e.target, viewAsUserLabel);
        }
    });

}