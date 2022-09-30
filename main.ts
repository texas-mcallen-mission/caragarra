function getThisWeeksPageData() {
    // let kiStartDate = new Date("September 20 2022")
    // let kiEndDate = new Date("September 25 2022")

    let weekConfig: sheetDataEntry = {
        tabName: "WeeklyData",
        headerRow: 0,
        includeSoftcodedColumns: true,
        initialColumnOrder: fbConfigOptions.lcs_data_column_config
    }

    let weekData:SheetData = new SheetData(new RawSheetData(weekConfig))

    // WYLO: trying to figure out how to get this week's data out programatically.
    // Also not sure exactly how to do this chunk; can't I just filter this in the big stream?
    // I think this should be more for a higher time granularity view

}


function test2() {
    let startDate = new Date();
    let startMillis = startDate.getUTCMilliseconds();
    let testDataConfig2: sheetDataEntry = {
        tabName: "fbDataBulkDemo",
        headerRow: 0,
        includeSoftcodedColumns: true,
        initialColumnOrder: fbConfigOptions.lcs_data_column_config
    };

    let testSheet2 = new SheetData(new RawSheetData(testDataConfig2));

    let self = new user(GITHUB_SECRET_DATA.access_token, fbConfigOptions, null);

    let allKiData: kiDataEntry[] = [];
    // TODO add args
    let test_args: extra_args = {
        // time_since: "2022-09-27",
        // time_until: "2022-09-29"
    }
    console.log(getTimeControlString_(test_args))

    let managedPages: fbPage[] = self.getManagedPageObjs();

    for (let page of managedPages) {
        let allPagePostStats = page.getAllPagePostData(test_args);
        let kiData = new kiDataClass(allPagePostStats);
        let additionalData = {
            page_id: page.page_id,
            page_name: page.getPageName(),
            log_time: new Date(),
        };
        kiData.bulkAppendObject(additionalData).addGranulatedTime("created_time", "compat_time", timeGranularities.minute);
        allKiData.push(...kiData.end);
        // Also need to figure out how to do the since= & until= stuff so that things work properly.
        // Ideally I'd be able to use the time stuff to both get individual page data objects as well as the stats stuff with the same args.
    }

    let kiDataObj = new kiDataClass(allKiData)
    let groupingKeys: string[] = ["page_name","post_id"]
    console.log(JSON.stringify(kiDataObj.groupDataByMultipleKeys(groupingKeys)))
    // testSheet2.setData(allKiData)
    testSheet2.insertData(allKiData);
    let endDate = new Date();
    let endMillis = endDate.getUTCMilliseconds();
    let duration = Math.floor((endMillis - startMillis) / 1000);
    console.log("Duration, seconds: ", duration);

}
function testerThingy() {
    let startDate = new Date();
    let startMillis = startDate.getUTCMilliseconds();
    // setup for sheetdata classs
    let testDataConfig: sheetDataEntry = {
        tabName: "fbDataDemo",
        headerRow: 0,
        includeSoftcodedColumns: true,
        initialColumnOrder: fbConfigOptions.lcs_data_column_config,
    };

    // let testSheetRaw = 
    let testSheet = new SheetData(new RawSheetData(testDataConfig));

    // now onto the FB-specific stuff.
    let self = new user(GITHUB_SECRET_DATA.access_token, fbConfigOptions, null);
    // let managedPages = self.getManagedPageData()
    let lcsData: kiDataEntry[] = [];

    // TODO add Arg passthrough
    let managedPages: fbPage[] = self.getManagedPageObjs();
    for (let page of managedPages) {
        // let pagePosts: post[] = page.getAllPostObjs();
        let pagePosts: post[] = page.getAllPostObjs()
        let page_post_ki_data: parsed_post_data[] = [];
        for (let pagePost of pagePosts) {
            let postData = pagePost.getPostStats();
            if (postData) {
                let post_stats = parsePostStats(postData);
                page_post_ki_data.push(post_stats);
            }

        }
        console.info(page.getPageName(), "stats:");
        // console.log(page_post_ki_data)
        let fbStatsClass = new kiDataClass(page_post_ki_data);
        let additionalData = {
            page_id: page.page_id,
            page_name: page.getPageName(),
            log_time: new Date(),
        };
        fbStatsClass.bulkAppendObject(additionalData).addGranulatedTime("created_time", "compat_time", timeGranularities.minute);

        let addedData = fbStatsClass.end;
        lcsData.push(...addedData);

        /* WYLO: Getting ready for integrating everything.
            Need to figure out the batching options so that I can get multiple posts's data from the same page at once
            - now that there's a standardized output, it shouldn't be that hard to do properly
            - might as well use the kiDataClass to do stuff like add bulk keypairs and the like


        */
    }

    testSheet.setData(lcsData);

    console.log("completed.");
    let endDate = new Date();
    let endMillis = endDate.getUTCMilliseconds();
    let duration = Math.floor((endMillis - startMillis) / 1000);
    console.log("Duration, seconds: ", duration);

}