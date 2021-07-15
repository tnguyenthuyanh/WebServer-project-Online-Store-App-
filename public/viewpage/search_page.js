import * as Element from './element.js'
import * as Util from './util.js'
import * as Auth from '../controller/auth.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Constant from '../model/constant.js'
import * as Home from './home_page.js'
import * as Route from '../controller/route.js'

export function addEventListener() {
    let option_value = '';
    Array.from(Element.optionSearch).forEach((option) => {
        option.addEventListener('click', (event) => {
        option_value = event.target.innerText;
        document.getElementById("dropdownMenuButton").innerHTML = option_value;
        });
    });

    Element.formSearch.addEventListener('submit', async e => {
        e.preventDefault();
        const searchKeys = e.target.searchKeys.value.trim();
        if (searchKeys.length == 0) {
            Util.info('Error', 'No search keys');
            return;
        }
        
        // By default: search by keywords
        if (!option_value) {
            option_value = 'keywords';
            document.getElementById("dropdownMenuButton").innerHTML = option_value;
        }
        const button = Element.formSearch.getElementsByTagName('button')[0];
        const label = Util.disableButton(button);
        // await Util.sleep(1000);

        const searchKeysInArray = searchKeys.toLowerCase().match(/\S+/g);
        const joinedSearchKeys = option_value + '_' + searchKeysInArray.join('+');
        history.pushState(null, null, Route.routePath.SEARCH + '#' + joinedSearchKeys);
        await search_page(joinedSearchKeys);
        Util.enableButton(button, label);
    });
}

export async function search_page(joinedSearchKeys) {
    var n = joinedSearchKeys.indexOf('_');
    let option = joinedSearchKeys.slice(0,n);
    joinedSearchKeys = joinedSearchKeys.slice(n+1);
    if (!joinedSearchKeys) { 
        Util.info('Error', 'No search keys');
        return;
    }

    const searchKeysInArray = joinedSearchKeys.split('+');
    if (searchKeysInArray.length == 0) {
        Util.info('Error', 'No search keys');
        return;
    }

    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Protected Page</h1>';
    }

    let threadList;
    try {
        if (option == 'keywords')
            threadList = await FirebaseController.searchThreadsByKeywords(searchKeysInArray);
        else if (option == 'title')
            threadList = await FirebaseController.searchThreadsByTitle(searchKeysInArray);
        else if (option == 'user')
            threadList = await FirebaseController.searchThreadsByUser(searchKeysInArray);
    } catch (e) {
        if (Constant.DEV) console.log(e)
            Util.info('Search Error', JSON.stringify(e));
        return;
    }

    Home.buildHomeScreen(threadList);
}