

// WYLO : GOT DATA OUT OF FACEBOOK!!!!
// CURRENTLY TRYING TO FIGURE OUT HOW TO GET ID's for people from comments
// If I can do that, I can make an "individual people commenting" stat instead of just a #Comments stat

// WYLO 2 : Seems like it's impossible to get commenter id's??
// Currently working on setting dates for stuff so that I can do things like only pull this week's posts
// Once that's done: It's time to figure out a better way to do access tokens (store them in the sheets???)
// after thaaat, then it's time to figure out what else we can do- I've got likes, comments & shares
// Not sure what else there is to do- maybe take a look at conversations?
// also might need to make a second page to see if I can access that or not
// It'd be interesting to see how posts do over time- have like an hourly thing that runs (and logs to sheets) how a post performs?


// OpNotes 1:
/*
    I finally got date ranges set up for requests- still not sure how to handle requests with multiple pages, and I don't have a simple way to get multiple pages...
    - maybe if I split it up into smaller segments for testing??


    I'll also need to figure out how to load up requests asynchronously to cut down on execution time
    - and figure out how to get a list of all page id's I can hit from a particular source

*/


const monthsOfYear = {
    long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    short: ["jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "sep", "Nov", "Dec"]
};

const fbConstants = {
    baseURL: 'https://graph.facebook.com/v15.0/',
    accessToken: "access_token=",
    fetchArgs: { "muteHttpExceptions": true }
};



function getPageIDs(userToken) {
    function pageManagerFetcher() {
        var url = fbConstants.baseURL + "me/accounts?type=page" + "&" + fbConstants.accessToken + userToken;
        var response = UrlFetchApp.fetch(url, fbConstants.fetchArgs);
        return JSON.parse(response.getContentText());
    }
    function getPageToken(userToken, pageID) {
        // "https://graph.facebook.com/PAGE-ID?fields=access_token&access_token=USER-ACCESS-TOKEN"
        var url = /*fbConstants.baseURL*/"https://graph.facebook.com/" + pageID + "?fields=access_token" + "&" + fbConstants.accessToken + userToken;
        var response = UrlFetchApp.fetch(url, fbConstants.fetchArgs);
        return JSON.parse(response.getContentText());
    }
    let inData = pageManagerFetcher();

    let pageIDs:any[] = [];

    if (inData.hasOwnProperty("data")) {
        for (let entry of inData.data) {
            // console.log(entry)
            entry["used_token"] = entry["access_token"];
            entry["access_token"] = getPageToken(userToken, entry.id)["access_token"];
            pageIDs.push(entry);
            // console.log(entry)
        }
    }
    return pageIDs;
}

function getThisSunday_() {
    // function getSundayOfCurrentWeek() {
    const today = new Date();
    today.setHours(1);
    today.setMinutes(0);
    today.setSeconds(0);

    const first = today.getDate() - today.getDay() + 1;
    const last = first;

    const sunday = new Date(today.setDate(last));
    // Logger.log(sunday.toISOString())
    return sunday;
}
// }

class fbPageData {
    baseUrl: string;
    accTo: any;
    pageID: any;
    pageName: any;
    constructor(page_id:string, access_token:string, page_name:string) {
        this.accTo = access_token;
        this.baseUrl = fbConstants.baseURL;
        this.pageID = page_id;
        this.pageName = page_name;
    }
    // deprecated
    // pageManagerFetcher(){
    //   var url = this.baseUrl + "me/accounts?type=page" + "&" + fbConstants.accessToken + this.accTo
    //   // console.log(url)
    //   var response = UrlFetchApp.fetch(url,fbConstants.fetchArgs)
    //   return JSON.parse(response.getContentText())
    // }

    allPostFetcher() {
        var url = this.baseUrl + this.pageID + "/feed?" + fbConstants.accessToken + this.accTo;
        var response = UrlFetchApp.fetch(url, { "muteHttpExceptions": true });


        // console.log(url)
        return JSON.parse(response.getContentText());
    }

    datedPostFetcher(startDate, endDate) {
        var datePickerString = "";
        var startExists = false;

        if (startDate) {
            var dateString = convertDateToFBCompatString_(startDate);
            startExists = true;
            datePickerString += "since=" + dateString;
        }

        if (endDate) {
            var dateString = convertDateToFBCompatString_(endDate);
            if (startExists) { datePickerString += "&"; }
            datePickerString += "until=" + dateString;
        }

        Logger.log(datePickerString);
        var url = this.baseUrl + this.pageID + "/feed?" + datePickerString + "&" + fbConstants.accessToken + this.accTo;
        var response = UrlFetchApp.fetch(url, fbConstants.fetchArgs);
        Logger.log(url);
        let responseData = response.getContentText();
        return JSON.parse(response.getContentText());


    }

    feedParser(fbFeedData) {

    }
    getPagePosts() {
        let inData = this.pagePostListFetcher();
        // console.log(inData)
        if (inData.hasOwnProperty("data")) {
            return inData.data;
        } else {
            return [];
        }
    }

    pagePostListFetcher() {
        var url = this.baseUrl + this.pageID + "/posts?" + fbConstants.accessToken + this.accTo;
        var response = UrlFetchApp.fetch(url, { "muteHttpExceptions": true });
        return JSON.parse(response.getContentText());
    }

    insightFetcher(entityID, request) {
        console.warn("hey, I don't think this works yet...");
        var url = this.baseUrl + entityID + request + "&" + fbConstants.accessToken + this.accTo;
        var response = UrlFetchApp.fetch(url, { "muteHttpExceptions": true });
        var json = response.getContentText();
        var data = JSON.parse(json);
        return data;
    }
    summarizePostStats(postIDs) {
        let outData = {
            likes: 0,
            comments: 0,
            shares: 0,
            pageID: this.pageID,
            pageName: this.pageName
        };
        // let postsIterated = 0
        // let innerLoops = 0
        // let conditLoops = 0
        for (let postID of postIDs) {
            let sumKeys = ["likes", "comments", "shares"];

            let inData = this.pagePostDataFetcher(postID.id);
            if (inData.hasOwnProperty("likes")) {
                outData.likes += +inData.likes.summary.total_count;
            }
            if (inData.hasOwnProperty("comments")) {
                outData.comments += +inData.comments.summary.total_count;
            }
            if (inData.hasOwnProperty("shares")) {
                outData.shares += +inData.shares.count;
            }


            // postsIterated += 1
        }
        // console.log("iterated posts:", postsIterated,"inner loops:",innerLoops,"condit loops:",conditLoops)
        return outData;
    }
    getPostStats(postID) {
        let inData = this.pagePostDataFetcher(postID);
        let outData = {
            id: "", likes: 0,
            comments: 0,
            shares: 0,
            message: "",
            pageID: this.pageID,
            pageName: this.pageName,
            isPopular: false
        };
        if (inData.hasOwnProperty("error")) {
            return outData;
        }

        outData.likes = inData["likes"]["summary"]["total_count"];
        outData.comments = inData["comments"]["summary"]["total_count"];
        // if(Object.hasOwnProperty())
        if (inData.hasOwnProperty("shares") && inData["shares"].hasOwnProperty("count")) {
            outData.shares = inData["shares"]["count"];

        }
        outData.isPopular = inData["is_popular"];
        outData.pageID = this.pageID;
        outData.message = inData["message"];

        outData.id = inData.id;

        return outData;


    }

    pagePostDataFetcher(postID) {
        var summaryUrl = this.baseUrl + /*pageID + "_" +*/ postID + "?fields=shares,likes.summary(true),comments.summary(true),message,is_popular,created_time" + "&" + fbConstants.accessToken + this.accTo;
        var summResponse = UrlFetchApp.fetch(summaryUrl, fbConstants.fetchArgs);
        // console.log(summaryUrl)
        var summJSON = JSON.parse(summResponse.getContentText());
        return summJSON;
    }

}

function run2() {
    let pageManagerData = getPageIDs(GITHUB_SECRET_DATA.access_token);
    for (let page of pageManagerData) {
        // console.log(page)

        let page_token = page.access_token;
        let page_id = page.id;
        let page_name = page.name;
        // page.tasks seems like it might be useful for figuring out what I'm able to do and what I can't...

        let fbDataClass = new fbPageData(page_id, page_token, page_name);
        let pagePosts = fbDataClass.getPagePosts();
        // let pagePostData = fbDataClass.getPostStats();
        // console.log(pagePostData);
        console.log(fbDataClass.summarizePostStats(fbDataClass.getPagePosts()));

    }
}


