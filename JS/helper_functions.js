async function getPlatformPercentageRecords(platformID, platformPage) {
    $(".table-body").empty()
    $(".loading-gif").fadeIn()

    // This function takes the current user id's platform id and platform page and makes a search records call to the platform percentages module.
    // It goes through all found platform percentage records, and uses that records account id to make a 2nd query. 
    // This 2nd query inside the loop of platform percentage records finds the additional platform percentage records for that agency (account) using that account's id. 
    // it then adds all relevant information into an object that will be used in the addRows function to visualize the data.

    // Response Variable
    let platformsQueryResponse;
    // data object. Will contain data for each agency that will be used in addRows function
    
    let finalObj = {}
        // first query of platform percentages, using current platform ID
    platformsQueryResponse = await ZOHO.CRM.API.searchRecord({ Entity: "Platform_Percentage", Type: "criteria", Query: `(Platforms:equals:${platformID})`, page: platformPage, per_page: 10 })
    // if there is a response (not 204 status code)
    if (platformsQueryResponse.data) {
        let platformPercentageRecords = platformsQueryResponse.data;
        // loop through found platform percentage records
        for (let i = 0; i < platformPercentageRecords.length; i++) {
            let platformPercentageRecord = platformPercentageRecords[i]
            // matched agency variables
            let agencyName = platformPercentageRecord.Agencies.name;
            let agencyId = platformPercentageRecord.Agencies.id;
            // current platform variables (platform that is on the platform_percentage record)
            let platformName = platformPercentageRecord.Platforms.name;
            let platformPercentage = platformPercentageRecord.Platform_Percentage;
            // create key in object with agency name 
            finalObj[agencyName] = {
                // store platforms as array in case of future additions
                platforms: [{ platformName, platformPercentage }],
                // store current agency's account id
                id: agencyId
            }

            let agencyQueryResponse;
            let agencyPage = 1
            // This will finally add the remaining platforms that are associated to the current agency. 

            // It gets all platform percentages with the current agency id, then filters out the current user's platform percentages since those have already been found.
            do {
                agencyQueryResponse = await ZOHO.CRM.API.searchRecord({ Entity: "Platform_Percentage", Type: "criteria", Query: `Agencies:equals:${agencyId}`, page: agencyPage, per_page: 200 })
                agencyPage += 1
                // loop through found additional platform percentages
                if (agencyQueryResponse.data) {
                    let additionalPlatformPercentages = agencyQueryResponse.data
                    for (let i = 0; i < additionalPlatformPercentages.length; i++) {
                        let additionalPlatformPercentageRecord = additionalPlatformPercentages[i]
                        let platformName = additionalPlatformPercentageRecord.Platforms.name
                        let additionalPlatformPercentage = additionalPlatformPercentageRecord.Platform_Percentage;
                        // we do not need to add the current user's platform so we add this condition
                        if (platformID != additionalPlatformPercentageRecord.Platforms.id) {
                            // add the platform to the platform array for the current agency (account)
                            finalObj[agencyName].platforms.push({
                                platformName,
                                platformPercentage: additionalPlatformPercentage
                            })

                        }


                    }
                }
            } while (agencyQueryResponse.info.more_records);
        }
    }
    $(".loading-gif").hide()

    return finalObj
}

async function addRows(finalObj) {
    let agencyCount = 0
        // create a row for every agency using this for loop
    for (let agency in finalObj) {
        agencyCount += 1
        // platforms for this row
        let platforms = []
        // percentages for this row
        let percentages = []
        // this row's account ID
        let agencyId = finalObj[agency].id;
        let platformPercentages = finalObj[agency].platforms
        // this loop pushes both platforms and platform percentages into their respective arrays.
        // the if statements are so the platform names have a space after the comma after the first index. 
        for (let i = 0; i < platformPercentages.length; i++) {
            let platformName = platformPercentages[i].platformName
            if (i != 0) {
                platformName = " " + platformName
            }
            platforms.push(platformName)
            let platformPercentage = platformPercentages[i].platformPercentage
            if (!platformPercentage) {
                platformPercentage = "None"
            }
            if (i != 0) {
                platformPercentage = " " + platformPercentage
            }
            percentages.push(platformPercentage)
        }
        let agencyClass;
        // handles background color of row
        if (agencyCount % 2 == 0) {
            agencyClass = 'EVEN'

        } else {
            agencyClass = 'ODD'
        }
        // append row to the table with proper values
        $(".table-body").append(`<div class="table-row ${agencyClass} flexed f-row">
        <div class="table-cell table-text row-name flexed f-ac" id="${agencyId}"  >
                ${agency}
        </div>

        <div class="table-cell table-text flexed f-ac" >${platforms.toString()}</div>
        <div class="table-cell flexed f-center"> ${percentages.toString()}</div>
    </div>`)
    }

}