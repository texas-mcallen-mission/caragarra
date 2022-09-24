// Step 0: Import lodash, because it's super-duper useful
//@ts-expect-error using external libraries is a little weird because it's not a classically-defined package...
var _ = lodash.load();

// Next: set up config for sheetCore to make it happy too:
const sheetCoreConfig: sheetCoreConfigInfo = {
    cacheKey: "SHEETCORe",
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


};

function convertDateToFBCompatString_(date) {
    let inDate = new Date(date);
    let outString = inDate.getDay() + " " + fbConfigOptions.monthConverter.short[inDate.getMonth()] + " " + inDate.getFullYear();
    return outString;
}

interface postArgs {
    startDate?: Date,
    endDate?: Date,
    limit?: number,
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

function fbFetcher_(request: string, access_token: string, includePages: boolean = false): {} {
    let appendCharacter = "?";
    if (request.includes("?")) {
        appendCharacter = "&";
    }
    let url: string = fbConfigOptions.baseURL + request + appendCharacter + fbConfigOptions.access_token_tag + access_token;
    var response = UrlFetchApp.fetch(url, fbConstants.fetchArgs);
    let responseData: {} = JSON.parse(response.getContentText());

    if (includePages && responseData.hasOwnProperty("next")) {
        let recurseData = fbFetcher_(responseData["next"], access_token, true);
        let intermediateOutput = _.mergeWith(responseData, recurseData, mergeCustomizer_);
        return intermediateOutput;
    }

    return responseData;
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
            let response = fbFetcher_(request, access_token);
            if (response.hasOwnProperty("id")) {
                let response = fbFetcher_(request, access_token);
                this.user_id = response["id"];
            }
        }
    }
    getManagedPageData(): pageManagementData_struct[] {
        let request = "me/accounts?type=page";
        //@ts-ignore function is too generalized atm to do this, but it's useful still...
        let response = fbFetcher_(request, this.access_token);
        if (!response.hasOwnProperty("data")) {
            return [];
        }
        let responseData: pageManagementData_struct[] = response["data"];
        let pages: pageManagementData_struct[] = [];


        for (let entry of responseData) {
            let request = entry.id + "?fields=access_token";
            // entry.used_token = entry.access_token;
            entry.page_access_token = fbFetcher_(request, this.access_token)["access_token"];
            pages.push(entry);
        }
        return pages;


    }

    getManagedPageObjs(): fbPage[] {
        let pages: fbPage[] = [];

        let managedPages: pageManagementData_struct[] = this.getManagedPageData();

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

    getAllPostList(): post_struct[] {
        let request = this.page_id + "/posts";
        let response = fbFetcher_(request, this.access_token);

        if (response.hasOwnProperty("data")) {
            return response["data"];
        } else {
            return [];
        }


    }

    getPostsList(args: {} | null | undefined) {
        let baseRequest = this.page_id + "/posts";
        if (args && args !== undefined) {
            let hasStart = false;
            let usesDate = false;
            if (args.hasOwnProperty("startDate")) {
                let compatDate = convertDateToFBCompatString_(args["startDate"]);
                baseRequest += "?";
                baseRequest += "since=" + compatDate;
            }
            // WYLO: finishing this bad boi up- need to add a the second date thingy, and whatever else the fb docs say I should be able to handle.

        }
    }
    getAllPagePostData() {
        let request = this.page_id + "/posts?fields=created_time,message,likes.summary(true),comments.summary(true),shares.summary(true),insights"
        let data = fbFetcher_(request, this.access_token)

        console.log(data)
        // I *THINK* data here should be of type post_struct_extra_stats[]
        console.log(data[0].getKeys())
    // basically there's a way to get multiple thingies at once at a wayyyyy cheaper I/O cost.  I'll have to figure this out eventually, first I need to figure out what all I need from it one-by-one
    // the above note matters more for a getAllPagePost_KIData or similar method that formats everything for me. 
    }
    getAllPostObjs():post[] {
        let inData:post_struct[] = this.getAllPostList()
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


interface parsed_post_data {
    likes: number,
    comments: number,
    shares: number,
    message: string,
    created_time: string,
    is_popular:boolean
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
        is_popular:false
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

    return outData
}

function test2() {
    let testDataConfig2: sheetDataEntry = {
        tabName: "fbDataBulkDemo",
        headerRow: 0,
        includeSoftcodedColumns:true,
        initialColumnOrder: {
            page_id: 0,
            page_name: 1,
            message: 2,
            likes: 3,
            comments: 4,
            shares: 5,
            is_popular: 6,
            created_time: 7,
            compat_time: 8,
        }
    }

    let testSheet2 = new SheetData(new RawSheetData(testDataConfig2))

    let self = new user(GITHUB_SECRET_DATA.access_token, fbConfigOptions, null)
    
    let kiData: kiDataEntry[] = []
    
    let managedPages: fbPage[] = self.getManagedPageObjs()
    
    for (let page of managedPages) {
        let allPagePostStats = page.getAllPagePostData()
        // WYLO: need to figure out how to handle bulk requests to knock down FB I/O time.
        // Also need to figure out how to do the since= & until= stuff so that things work properly.
        // Ideally I'd be able to use the time stuff to both get individual page data objects as well as the stats stuff with the same args.
    }
}
function testerThingy() {
    // setup for sheetdata classs
    let testDataConfig: sheetDataEntry = {
        tabName: "fbDataDemo",
        headerRow: 0,
        initialColumnOrder: {
            page_id: 0,
            page_name: 1,
            message: 2,
            likes: 3,
            comments: 4,
            shares: 5,
            is_popular: 6,
            created_time: 7,
            compat_time: 8,
        },
        includeSoftcodedColumns: true,
    };
    
    // let testSheetRaw = 
        let testSheet = new SheetData(new RawSheetData(testDataConfig);)
    
    // now onto the FB-specific stuff.
    let self = new user(GITHUB_SECRET_DATA.access_token, fbConfigOptions, null);
    // let managedPages = self.getManagedPageData()
    let lcsData:kiDataEntry[] = []


    let managedPages:fbPage[] = self.getManagedPageObjs()
    for (let page of managedPages) {
        let pagePosts: post[] = page.getAllPostObjs()
        let page_post_ki_data:parsed_post_data[] = []
        for (let pagePost of pagePosts) {
            let postData = pagePost.getPostStats()
            if (postData) {
                let post_stats = parsePostStats(postData);
                page_post_ki_data.push(post_stats)
            }

        }
        console.info(page.getPageName(),"stats:")
        // console.log(page_post_ki_data)
        let fbStatsClass = new kiDataClass(page_post_ki_data)
        let additionalData = {
            page_id: page.page_id,
            page_name: page.getPageName(),
        }
        fbStatsClass.bulkAppendObject(additionalData).addGranulatedTime("created_time", "compat_time", timeGranularities.minute)

        let addedData = fbStatsClass.end
        lcsData.push(...addedData)
        /* WYLO: Getting ready for integrating everything.
            Need to figure out the batching options so that I can get multiple posts's data from the same page at once
            - now that there's a standardized output, it shouldn't be that hard to do properly
            - might as well use the kiDataClass to do stuff like add bulk keypairs and the like


        */
    }

    testSheet.setData(lcsData)
    console.log("completed.")

}

