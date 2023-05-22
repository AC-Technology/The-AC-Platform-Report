$(document).ready(async function () {
    ZOHO.embeddedApp.on('PageLoad', async () => {
        //===============================//
        // Gathering and Filtering Data //
        //=============================//
        // Get Current User Data for user's name //
        const userObject = await ZOHO.CRM.CONFIG.getCurrentUser()
        // Current User Full Name //
        let currentUserFullName = userObject["users"][0].full_name
        // prepare user's name for filtering
        currentUserFullName = currentUserFullName.replace(/\s/g, "");
        currentUserFullName = currentUserFullName.toLowerCase();

        //===================================//
        // Get Records from Platform Module //
        const allPlatformRecords = await getAllPlatformRecords()
        // Filter Platform Records using User's Name //
        const matchingPlatformRecords = await filterPlatformRecords(allPlatformRecords, currentUserFullName)
        // get platform id's for searching using matched platform records
        let platformsIDs = _.map(matchingPlatformRecords, "id")
        // get platform percentage records using matched record id's
        const platformPercentageRecords = await getPlatformPercentageRecords(platformsIDs)
        let agencies = _.map(platformPercentageRecords, "Agencies")
        let agencyIDs = _.map(agencies, "id")

        // get account records for matched agency records
        const accountRecords = await getAccountRecords(agencyIDs)
        let platforms = _.map(accountRecords, "Platforms")
        // prepare platform names for matching
        let platformArray = []
        for (let i = 0; i < platforms.length; i++) {
            let array = platforms[i].split(',');
            for (let i = 0; i < array.length; i++) {
                array[i] = array[i].trimStart();
            }
            platformArray += array + ','
        }
        // match platform with current user name
        platformArray = platformArray.split(',')
        platformArray.splice(-1)
        platformArray = platformArray.filter(unique)
        for (let i = 0; i < platformArray.length; i++) {
            element = platformArray[i].replace(/\s/g, "");
            element = element.toLowerCase()
            if (element == currentUserFullName) {
                platformArray.splice(i, 1)
            } else {
                continue
            }
        }
        platformArray = platformArray.toString()
        platformArray = platformArray.replace(/\s/g, "");
        platformArray = platformArray.toLowerCase();

        // Filter Platform Records to Matching //
        const additionalMatchingPlatformRecords = await filterPlatformRecords(allPlatformRecords, platformArray)
        let additionalPlatformsIDs = _.map(additionalMatchingPlatformRecords, "id")
        const additionalPlatformPercentageRecords = await getPlatformPercentageRecords(additionalPlatformsIDs)
        let additonalAgencies = _.map(additionalPlatformPercentageRecords, "Agencies")
        let additionalAgencyIDs = _.map(additonalAgencies, "id")
        const additionalAccountRecords = await getAccountRecords(additionalAgencyIDs)
        // Push Additional Account Records into our primary "accountRecords" Object
        for (let i = 0; i < additionalAccountRecords.length; i++) {
            accountRecords.push(additionalAccountRecords[i])
        }
        // Push Additional Platform Percentage Records into our primary "platformPercentageRecords" variable
        for (let i = 0; i < additionalPlatformPercentageRecords.length; i++) {
            platformPercentageRecords.push(additionalPlatformPercentageRecords[i])
        }
        // Push Additional Related Platform Records into our primary "matchingPlatformRecords" variable
        for (let i = 0; i < additionalMatchingPlatformRecords.length; i++) {
            matchingPlatformRecords.push(additionalMatchingPlatformRecords[i])
        }
        // Get all our account names from "accountRecords" variable
        let accountNameArray = []
        for (let i = 0; i < accountRecords.length; i++) {
            let accountName = accountRecords[i].Account_Name;
            accountNameArray.push(accountName)
        }
        // Get all our associated Platform(s) and Platform Percentage Records from "platformPercentageRecords" variable
        let platformsArray = []
        let platformPercentageArray = []
        for (let i = 0; i < platformPercentageRecords.length; i++) {
            let platformPercentage = platformPercentageRecords[i].Platform_Percentage;
            let platforms = platformPercentageRecords[i].Platforms.name;
            platformsArray.push(platforms)
            platformPercentageArray.push(platformPercentage)
        }
        // Filter to only unique account names (no duplicates)
        const uniqueAccountNameArray = accountNameArray.filter(unique)
        // Create our Main Object we will use for the rest of the program
        const mainObject = uniqueAccountNameArray.reduce((acc, curr) => (acc[curr] = [], acc), {});
        // Loop through our array of Unique Account Names
        for (let i = 0; i < uniqueAccountNameArray.length; i++) {
            let accountName = uniqueAccountNameArray[i]
            for (let i = 0; i < accountNameArray.length; i++) {
                if (accountName == accountNameArray[i]) {
                    let obj = {
                        "platform": platformsArray[i],
                        "percentage": platformPercentageArray[i]
                    }
                    mainObject[accountName].push(obj)
                }
            }
        }
        // console.log("mainObject")
        // console.log(mainObject)

        // Sort Object Alphabetically
        const sortedMainObject = await orderKeys(mainObject)
        uniqueAccountNameArray.sort()
        for (let i = 0; i < uniqueAccountNameArray.length; i++) {
            let item = sortedMainObject[uniqueAccountNameArray[i]]
            let platforms = _.map(item, "platform")
            let platformsArr = []
            platforms.forEach(element => {
                element = element.replace(/\s/g, "");
                element = element.toLowerCase();
                platformsArr.push(element)
            })
            let x = platformsArr.includes(currentUserFullName)
            if (x == false) {
                delete sortedMainObject[uniqueAccountNameArray[i]]
                uniqueAccountNameArray.splice(i, 1)
                // continue
            }
            else {
                if (item.length > 1) {
                    for (let i = 0; i < item.length; i++) {
                        console.log(item[i].percentage)
                        if (item[i].percentage == null) {
                            item[i].percentage = "None"
                        }
                    }
                } else {
                    if (item[0].percentage == null) {
                        item[0].percentage = "None"
                    }
                }
            }
        }

        for (let i = 0; i < uniqueAccountNameArray.length; i++) {
            let item = sortedMainObject[uniqueAccountNameArray[i]];
            let ID = uniqueAccountNameArray[i].replaceAll(/\s/g, '_');
            $(".column-1").append(`<div class="grid-item ${ID} Agency" id="${ID}">${uniqueAccountNameArray[i]}</div>`)
            if (item.length > 1) {
                console.log(item)
                for (let i = 0; i < item.length; i++) {
                    console.log(item[i].percentage)
                    if (item[i].percentage == "None") {
                        percentage = "None"
                    }
                    else {
                        percentage = `${item[i].percentage}%`
                    }
                    $(".column-2").append(`<div class="grid-item ${ID}" id="${ID + "_" + item[i].platform}">${item[i].platform}</div>`)
                    $(".column-3").append(`<div class="grid-item ${ID}" id="${ID + "_" + item[i].platform + "_" + item[i].percentage}">${percentage}</div>`)
                }
                let elementHeight = $(`#${ID}`).css("height");
                elementHeight = elementHeight.replace("px", "");
                elementHeight = parseInt(elementHeight);
                let newHeight = (elementHeight * item.length);
                $(`#${ID}`).css("height", `${newHeight}px`);
            } else {
                if (item[0].percentage == "None") {
                    percentage = "None"
                }
                else {
                    percentage = `${item[0].percentage}%`
                }
                $(".column-2").append(`<div class="grid-item ${ID}" id="${ID + "_" + item[0].platform}">${item[0].platform}</div>`)
                $(".column-3").append(`<div class="grid-item ${ID}" id="${ID + "_" + item[0].percentage}">${item[0].percentage}</div>`)
            }
        }
        for (let i = 0; i < uniqueAccountNameArray.length; i++) {
            let item = sortedMainObject[uniqueAccountNameArray[i]]
            let platforms = _.map(item, "platform")
            let ID = uniqueAccountNameArray[i].replaceAll(/\s/g, '_');
            let elements = document.getElementsByClassName(`${ID}`)
            let platformsArr = []
            platforms.forEach(element => {
                element = element.replace(/\s/g, "");
                element = element.toLowerCase();
                platformsArr.push(element)
            })
            if (i % 2 == 0) {
                for (let i = 0; i < elements.length; i++) {
                    elements[i].classList.add("EVEN")
                }
            } else {
                for (let i = 0; i < elements.length; i++) {
                    elements[i].classList.add("ODD")
                }
            }
            for (let i = 0; i < elements.length; i++) {
                const standardHeight = elements[0].clientHeight
                if (elements.length > 3) {
                    if (i > 0) {
                        let id = elements[i].id
                        document.getElementById(`${id}`).style.height = standardHeight / platforms.length;
                    }
                    continue;
                } else {
                    if (i > 0) {
                        let id = elements[i].id
                        document.getElementById(`${id}`).style.height = standardHeight;
                    }
                }
            }
        }
    })
    ZOHO.embeddedApp.init()
});