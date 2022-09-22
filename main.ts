// Step 0: Import lodash, because it's super-duper useful
//@ts-expect-error using external libraries is a little weird because it's not a classically-defined package...
var _ = lodash.load();

// Step 1: Define the FB stuff we're going to use


const fbConfigOptions = {
    baseURL: 'https://graph.facebook.com/v15.0/',
    access_token_tag: "access_token=",
    fetch_args: { "muteHttpExceptions": true },
    monthConverter: {
        long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        short: ["jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "sep", "Nov", "Dec"]
    },


}

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

function mergeCustomizer(objValue, srcValue) {
    if (_.isArray(objValue)) {
        // console.log("key:",key)
        // console.log("object:",object)
        // console.log("source:",source)
        // console.log("stack:",stack)
        // console.log("objValue:",objValue)
        // console.log("srcValue",srcValue)
        // console.log(objValue)
        // console.log(srcValue)
        let out_obj = [...objValue, ...srcValue];
        return out_obj;
    }
}

function testMergeCustomizer() {
    let obj1 = {
        key1: "WORDS",
        key2: "Key2",
        key3: { key3_1: "worrrd" },
        array1: ["CHICKEN NUGGET","TESTBUCKET"]
    }
    let obj2 = {
        key2: "replacement",
        key3: { key3_2: "additionalStuff" },
        array1: ["WHOOPDY","TEST"]
    }
    let expectedResult = {
        key1: "WORDS",
        key2: "replacement",
        key3: { key3_1: "worrrd", key3_2: "additionalStuff" },
        array1: ["CHICKEN NUGGET", "TESTBUCKET", "WHOOPDY", "TEST"]
    }

    console.log(_.merge(obj1, obj2))
    console.log(_.mergeWith(obj1,obj2,mergeCustomizer))

}

function fbFetcher(request: string, access_token:string,includePages:boolean = true): {} {
    let appendCharacter = "?"
    if (request.includes("?")) {
        appendCharacter = "&"
    }
    let url: string = fbConfigOptions.baseURL + request + appendCharacter + fbConfigOptions.access_token_tag + access_token
    var response = UrlFetchApp.fetch(url, fbConstants.fetchArgs)
    let responseData: {} = JSON.parse(response.getContentText())
    
    if (includePages && responseData.hasOwnProperty("next")) {
        let recurseData = fbFetcher(responseData["next"], access_token, true)
        let intermediateOutput = _.mergeWith(responseData, recurseData, mergeCustomizer)
        return intermediateOutput
    }

    return responseData;
}

class fbPage {
    access_token: string;
    page_id: string;
    config: any;
    // here's where we'll get to page data, as well as information from a page's edges
    constructor(access_token: string, page_id: string,fbConfigOptions) {
        this.access_token = access_token
        this.page_id = page_id
        this.config = fbConfigOptions
    }

    getAllPostList():any[] {
        let request = this.page_id + "/posts"
        let response = fbFetcher(request, this.access_token)

        if (response.hasOwnProperty("data")) {
            return response["data"]
        } else {
            return []
        }


    }

    getPostsList(args: {} | null | undefined) {
        let baseRequest = this.page_id + "/posts"
        if (args && args !== undefined) {
            let hasStart = false
            let usesDate = false
            if (args.hasOwnProperty("startDate")) {
                let compatDate = convertDateToFBCompatString_(args["startDate"])
                baseRequest += "?"
                baseRequest += "since=" + compatDate
            }
             // WYLO: finishing this bad boi up- need to add a the second date thingy, and whatever else the fb docs say I should be able to handle.
            
        }
    }


}