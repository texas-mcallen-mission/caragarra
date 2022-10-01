// Step 0: Import lodash, because it's super-duper useful
//@ts-expect-error using external libraries is a little weird because it's not a classically-defined package...
var _ = lodash.load();

// Next: set up config for sheetCore to make it happy too:
const sheetCoreConfig: sheetCoreConfigInfo = {
    cacheKey: "SHEETCORE",
    cacheExpiration: 1800,
    cacheEnabled: true,


};
// Step 1: Define the FB stuff we're going to use



const fbConfigOptions = {
    baseURL: 'https://graph.facebook.com/v15.0/',
    access_token_tag: "access_token=",
    fetch_args: { "muteHttpExceptions": true },
    monthConverter: {
        long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        short: ["jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "sep", "Nov", "Dec"]
    },
    lcs_data_column_config: {
            page_id: 0,
            page_name: 1,
            post_id: 2,
            message: 3,
            likes: 4,
            comments: 5,
            shares: 6,
            is_popular: 7,
            created_time: 8,
            compat_time: 9,
            log_time: 10,
        
    }
}
interface timeControlData extends extra_args {
    time_since?: Date | string,
    time_until?: Date | string,
}
function getTimeControlString_(timeData: timeControlData): string {
    let outData: string = ""    
    let hasStart = false

    if (timeData.hasOwnProperty("time_since")) {
        var sinceString = convertDateToFBCompatString_(timeData.time_since)
        hasStart = true
        outData += "since=" + sinceString
    }
    if (timeData.hasOwnProperty("time_until")) {
        var untilString: string = convertDateToFBCompatString_(timeData.time_until)
        if (hasStart == true) {
            outData += "&"
        }

        outData += "until=" + untilString

    }



    return outData
}

function convertDateToFBCompatString_(date) {
    let inDate = new Date(date);
    let outString = inDate.getDate() + " " + fbConfigOptions.monthConverter.short[inDate.getMonth()] + " " + inDate.getFullYear();
    return outString;
}


function mergeCustomizer_(objValue, srcValue) {
    if (_.isArray(objValue)) {
        let out_obj = [...objValue, ...srcValue];
        return out_obj;
    }
}

function testMergeCustomizer() {
    let obj1 = {
        key1: "WORDS",
        key2: "Key2",
        key3: { key3_1: "worrrd" },
        array1: ["CHICKEN NUGGET", "TESTBUCKET"]
    };
    let obj2 = {
        key2: "replacement",
        key3: { key3_2: "additionalStuff" },
        array1: ["WHOOPDY", "TEST"]
    };
    let expectedResult = {
        key1: "WORDS",
        key2: "replacement",
        key3: { key3_1: "worrrd", key3_2: "additionalStuff" },
        array1: ["CHICKEN NUGGET", "TESTBUCKET", "WHOOPDY", "TEST"]
    };

    // console.log(_.merge(obj1, obj2));
    // console.log(_.mergeWith(obj1, obj2, mergeCustomizer_));

}

function fbFetcher_(request: string, access_token: string, includePages: boolean = true): {} {
    let appendCharacter = "?";
    if (request.includes("?")) {
        appendCharacter = "&";
    }
    let url:string = "";
    // these modifications let you pass a whole entire request string (like the ones returned by paging.next & paging.previous) directly.
    // check to see if request has https:// in it:
    if (!request.includes("https://graph")) {
        url += fbConfigOptions.baseURL;
    }
    url += request;
    // then check to see if request aready has an access token attached to it
    if (!request.includes(fbConfigOptions.access_token_tag)) {
        url += appendCharacter + fbConfigOptions.access_token_tag + access_token;
    }
    // let url: string = fbConfigOptions.baseURL + request + appendCharacter + fbConfigOptions.access_token_tag + access_token;
    var response = UrlFetchApp.fetch(url,fbConfigOptions.fetch_args);
    let responseData: {} = JSON.parse(response.getContentText());
    // makes sure conditions are right to run this thing.  responseData["data"] check is for sanity and for making the TS linter happy
    if (includePages && responseData.hasOwnProperty("paging") && responseData.hasOwnProperty("data")) {
        // not having this conditional makes this not compliant with FB's specs: on the last page it'll return an object without the paging.next property.
        if (responseData["paging"].hasOwnProperty("next")) {
            
            let outData = responseData["data"]
            console.warn("Fetching multiple pages for request!")
            let recurseData = fbFetcher_(responseData["paging"]["next"], access_token, true);
            if (recurseData.hasOwnProperty("data")) {
                outData.push(...recurseData["data"])
            }
            responseData["data"] = outData
        }
    }

    return responseData;
}

interface fetchArgs {
    
}

class user {
    access_token: string;
    user_id: string;
    config: any;
    constructor(access_token: string, config: {}, user_id: string | null = null) {
        this.access_token = access_token;
        if (user_id != null) {
            this.user_id = user_id;
        } else {
            // makes it to where we treat things the same for me's as other people.  May not be a good idea?
            let request = "me?fields=id";
            let response = fbFetcher_(request, access_token,false);
            if (response.hasOwnProperty("id")) {
                // let response = fbFetcher_(request, access_token);
                this.user_id = response["id"];
            }
        }
    }

    getManagedPageData(extra_args: extra_args = {}): pageManagementData_struct[] {
        let request = "me/accounts?type=page";
        //@ts-ignore function is too generalized atm to do this, but it's useful still...
        let response = fbFetcher_(request, this.access_token);
        if (!response.hasOwnProperty("data")) {
            return [];
        }
        // arg-stacking boilerplate...
        if (extra_args.hasOwnProperty("time_since") || extra_args.hasOwnProperty("time_until")) {
            request += "&" + getTimeControlString_(extra_args)
        }
        let include_pages = true;
        if (extra_args.hasOwnProperty("include_pages")) {
            // @ts-ignore this is literally checking to see if it'll work or not RIGHT THERE
            include_pages = extra_args.include_pages;
        }

        let responseData: pageManagementData_struct[] = response["data"];
        let pages: pageManagementData_struct[] = [];


        for (let entry of responseData) {
            let request = entry.id + "?fields=access_token";
            // entry.used_token = entry.access_token;

            let test = {}

            entry.page_access_token = fbFetcher_(request, this.access_token,include_pages)["access_token"];
            pages.push(entry);
        }
        return pages;
    }

    getManagedPageObjs(extra_args: extra_args = {}): fbPage[] {
        let pages: fbPage[] = [];

        let managedPages: pageManagementData_struct[] = this.getManagedPageData(extra_args);

        for (let pageInfo of managedPages) {
            let pageObj = new fbPage(pageInfo.page_access_token, pageInfo.id, this.config);
            pages.push(pageObj);
        }

        return pages;
    }
}

class fbPage {
    access_token: string;
    page_id: string;
    config: any;
    // here's where we'll get to page data, as well as information from a page's edges
    constructor(access_token: string, page_id: string, fbConfigOptions) {
        this.access_token = access_token;
        this.page_id = page_id;
        this.config = fbConfigOptions;
    }

    getAllPostList(extra_args: extra_args = {}): post_struct[] {
        let request = this.page_id + "/posts";
        // arg-stacking boilerplate...
        if (extra_args.hasOwnProperty("time_since") || extra_args.hasOwnProperty("time_until")) {
            request += "&" + getTimeControlString_(extra_args);
        }
        let include_pages = true;
        if (extra_args.hasOwnProperty("include_pages")) {
            // @ts-ignore this is literally checking to see if it'll work or not RIGHT THERE
            include_pages = extra_args.include_pages;
        }
        let response = fbFetcher_(request, this.access_token,include_pages);

        if (response.hasOwnProperty("data")) {
            return response["data"];
        } else {
            return [];
        }


    }

    // getAllPostObjsPaginated(): post[] {
    //     let inData: post_struct[] = this.getAllPostPaginatedTest();
    //     let posts: post[] = [];
    //     for (let postEntry of inData) {
    //         let postObj = new post(postEntry.id, this.access_token);
    //         posts.push(postObj);
    //     }

    //     return posts;
    // }

    // getAllPostPaginatedTest(): post_struct[] {
    //     let request = this.page_id + "/posts?limit=4"
    //     let response = fbFetcher_(request, this.access_token,true)

    //     if (response.hasOwnProperty("data")) {
    //         console.log(response["data"].length)
    //         return response["data"];
    //     } else {
    //         return []

    //     }
    // }

    // getPostsList(args: {} | null | undefined) {
    //     let baseRequest = this.page_id + "/posts";
    //     if (args && args !== undefined) {
    //         let hasStart = false;
    //         let usesDate = false;
    //         if (args.hasOwnProperty("startDate")) {
    //             let compatDate = convertDateToFBCompatString_(args["startDate"]);
    //             baseRequest += "?";
    //             baseRequest += "since=" + compatDate;
    //         }
    //         // WYLO: finishing this bad boi up- need to add a the second date thingy, and whatever else the fb docs say I should be able to handle.

    //     }
    // }
    getAllPagePostData(extra_args: extra_args = {}):parsed_post_data[] {
        let request = this.page_id + "/posts?fields=created_time,message,likes.summary(true),comments.summary(true),shares.summary(true),insights"
        // arg-stacking boilerplate...
        if (extra_args.hasOwnProperty("time_since") || extra_args.hasOwnProperty("time_until")) {
            request += "&" + getTimeControlString_(extra_args);
        }
        let include_pages = true;
        if (extra_args.hasOwnProperty("include_pages")) {
            // blocker @ts-ignore this is literally checking to see if it'll work or not RIGHT THERE
            include_pages = extra_args.include_pages ?? true
        }
        let data = fbFetcher_(request, this.access_token)

        let fbPostData: post_struct_extra_stats[] = []
        let outData : parsed_post_data[] = []
        if (data.hasOwnProperty("data")) {
            fbPostData = data["data"]
        }
        for (let postData of fbPostData) {
            outData.push(parsePostStats(postData))
        }
        console.log(outData)
        // console.log(fbPostData)
        // // I *THINK* data here should be of type post_struct_extra_stats[]
        // console.log(Object.getOwnPropertyNames(fbPostData[0]))

        // WYLO: making sure everything is in the post_struct_extra_stats format.
        // basically there's a way to get multiple thingies at once at a wayyyyy cheaper I/O cost.  I'll have to figure this out eventually, first I need to figure out what all I need from it one-by-one
        // the above note matters more for a getAllPagePost_KIData or similar method that formats everything for me.

        return outData
    }
    getAllPostObjs(extra_args: extra_args = {}):post[] {
        let inData:post_struct[] = this.getAllPostList(extra_args)
        let posts:post[] = []
        for (let postEntry of inData) {
            let postObj = new post(postEntry.id, this.access_token)
            posts.push(postObj)
        }

        return posts
    }
    getPageName(): string {
        let request = this.page_id + "?fields=name"
        
        let data = fbFetcher_(request, this.access_token)
        if (data.hasOwnProperty("name")) {
            return data["name"];
        } else {
            return ""
        }
    }

}


class post {
    access_token: string
    post_id:string
    
    constructor(post_id,access_token) {
        this.post_id = post_id
        this.access_token = access_token
    }

    getPostStats():post_struct_extra_stats|null {
        let request = this.post_id + "?fields=likes.summary(true),comments.summary(true),shares.summary(true),is_popular,created_time,message"
        
        // WYLO: Trying to figure out how to get this thingy to work right; I don't have as many docs as I'd like for this part... :(
        let inData: post_struct_extra_stats | {} = fbFetcher_(request, this.access_token)
        // console.log(inData)
        if (inData.hasOwnProperty("likes")) {
            // let requestData: post_struct_extra_stats = inData["data"]
            //@ts-ignore yeah, not quite smart enough to not mute this thing yet.  TODO FIX
            return inData

        } else {
            return null
        }

    }

}

/**
 *  Takes in a fully stat-filled post data structure and returns a nice & flat entry usable with kiData.
 *
 * @param {post_struct_extra_stats} post_data
 */
function parsePostStats(post_data: post_struct_extra_stats):parsed_post_data {
    // let outData = {}
    let outData = {
        likes: 0,
        comments: 0,
        shares: 0,
        message: "",
        created_time: "",
        is_popular: false,
        post_id: "",
    };
    outData.likes = post_data.likes.summary.total_count;
    outData.comments = post_data.comments.summary.total_count;
    if (post_data.hasOwnProperty("shares")) {
        //@ts-expect-error stupid linter doesn't know I'm LITERALLY CHECKING FOR THAT ERROR
        if (post_data["shares"].hasOwnProperty("count")) {
            //@ts-expect-error same as above, I'm literally checking for that RIGHT HERE 
            outData.shares = post_data["shares"]["count"]
        }
        
    }
    outData.message = post_data.message;
    outData.created_time = post_data.created_time
    outData.is_popular = post_data.is_popular
    outData.post_id = post_data.id

    return outData
}


