import * as Home from '../viewpage/home_page.js'
import * as Purchase from '../viewpage/purchase_page.js'
import * as Cart from '../viewpage/cart.js'
import * as Profile from '../viewpage/profile_page.js'

export const routePathnames = {
    HOME: '/',
    PURCHASE: '/purchase',
    PROFILE: '/profile',
    CART: '/cart',
}

export const routes = [
    {pathname: routePathnames.HOME, page: Home.home_page},
    {pathname: routePathnames.PURCHASE, page: Purchase.purchase_page},
    {pathname: routePathnames.CART, page: Cart.cart_page},
    {pathname: routePathnames.PROFILE, page: Profile.profile_page},
];

export function routing(pathname, hash) {
    const route = routes.find(r => r.pathname == pathname);
    if (route) route.page();
    else routes[0].page();
}