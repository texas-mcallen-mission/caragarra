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

function fbFetcher(request: string, access_token:string): {} {
    let appendCharacter = "?"
    if (request.includes("?")) {
        appendCharacter = "&"
    }
    let url: string = fbConfigOptions.baseURL + request + appendCharacter + fbConfigOptions.access_token_tag + access_token
    var response = UrlFetchApp.fetch(url, fbConstants.fetchArgs)
    return JSON.parse(response.getContentText())
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