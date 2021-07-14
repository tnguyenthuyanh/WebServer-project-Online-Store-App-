import * as Home from '../viewpage/home_page.js'
import * as Purchase from '../viewpage/purchase_page.js'
import * as Cart from '../viewpage/cart.js'
import * as Profile from '../viewpage/profile_page.js'
import * as User from '../viewpage/user_page.js'
import * as Product from '../viewpage/product_page.js'
import * as ProductDetails from '../viewpage/product_details_page.js'
import * as Auth from '../controller/auth.js'
import * as Constant from '../model/constant.js'
import * as Saved from '../viewpage/saved_page.js'

export const routePathnames = {
    HOME: '/',
    PURCHASE: '/purchase',
    PROFILE: '/profile',
    CART: '/cart',
    USERS: '/users',
    PRODUCTS: '/products',
    ITEM: '/item',
    SAVED: '/saved',
}

export const routes = [
    { pathname: routePathnames.HOME, page: Home.home_page },
    { pathname: routePathnames.PURCHASE, page: Purchase.purchase_page },
    { pathname: routePathnames.CART, page: Cart.cart_page },
    { pathname: routePathnames.PROFILE, page: Profile.profile_page },
    { pathname: routePathnames.USERS, page: User.users_page },
    { pathname: routePathnames.PRODUCTS, page: Product.product_page },
    { pathname: routePathnames.ITEM, page: ProductDetails.product_details_page },
    { pathname: routePathnames.SAVED, page: Saved.saved_page },
];

export function routing(pathname, hash) {
    const route = routes.find(r => r.pathname == pathname);
    if (route) {
        if (hash && hash.length > 1)
            route.page(hash.substring(1));
        else {
            if (!Auth.currentUser || !Constant.adminEmails.includes(Auth.currentUser.email))
                route.page();
            else routes[5].page();
        }
    } else if (Auth.currentUser && Constant.adminEmails.includes(Auth.currentUser.email)) {
        routes[5].page();
    }
    else
        routes[0].page();

}