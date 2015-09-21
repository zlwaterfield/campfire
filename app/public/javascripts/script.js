function clear_this() {
    window.location = '/explore/';
}

//function gototag(title) {
//    console.log("Called");
//
//    var loc = window.location.pathname;
//    var ind = loc.indexOf('explore/');
//    var sub = loc.substring(ind + 8);
//
//    if(sub.length > 1 && sub.indexOf(title) == -1) {
//        title = sub + '+' + title;
//    } else if(sub.indexOf(title) > -1) {
//        title = sub.substring(0, sub.indexOf(title) -1) + sub.substring(sub.indexOf(title) + title.length);
//    } else if(sub.length > 0) {
//        title = sub;
//    }
//    console.log(title.indexOf("+"));
//    if(title.indexOf('+') == 0) {
//        console.log(title.substring(1));
//        title = title.substring(1);
//    }
//    window.location = '/explore/' + title;
//}

