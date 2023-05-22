$(document).ready(async function () {
    ZOHO.embeddedApp.on('PageLoad', async () => {
        //===============================//
        // Gathering and Filtering Data //
        //=============================//
        $("#left-arrow-icon").hide()

        // Get Current User Data for user's id //
        const userObject = await ZOHO.CRM.CONFIG.getCurrentUser()
        let currentUserId = userObject["users"][0].id

        // test id (Collin's)
        // let currentUserId = "5187612000000684001"
        let id_map = {
            // User ID: Corresponding Platform record ID
            // Super Admin
            "5187612000000356001": "5187612000001025605",
            // Collin Urbania
            "5187612000000684001": "5187612000001025605",
            // Adam Urbania
            "5187612000000683001": "5187612000001025585",
            // David Edkins
            "5187612000000720001": "",
            // Holly Schultz
            "5187612000000979001": "",
            // Breanna Irwin 
            "5187612000000982001": "",
            //Mackenzy Schaefer
            "5187612000000983001": "",
            // Stacy Yarshen
            "5187612000000984001": "",
            // Tracy Culler
            "5187612000000986001": "",
            // Paula Bertone
            "5187612000000987001": "",
            // Chuck Webb
            "5187612000000988001": "5187612000009815005",
            // Vanessa Cassina
            "5187612000003517001": "",
            // Gary Hines
            "5187612000008512001": "",
            // Kenny Urbania
            "5187612000008702001": "",
            // Karen Gambrel
            "5187612000012375037": ""

        }
        // get the current user's corresponding platform id using their user id
        let platformID = id_map[currentUserId]
    
        // load first page of data
        let platformPage = 1
        let dataObj = await getPlatformPercentageRecords(platformID, platformPage)
        addRows(dataObj)

        // page view controls
        $("#right-arrow-icon").click(async function () {
            platformPage += 1
            dataObj = await getPlatformPercentageRecords(platformID, platformPage)
            addRows(dataObj)
            $("#left-arrow-icon").fadeIn()
        })
        $("#left-arrow-icon").click(async function () {
            platformPage -= 1
            if (platformPage == 1) {
                $("#left-arrow-icon").hide()
            }
            dataObj = await getPlatformPercentageRecords(platformID, platformPage)
            addRows(dataObj)
        })
        // opens the clicked agency
        $(".row-name").click(function () {
            let agencyId = $(this).attr("id")
            ZOHO.CRM.UI.Record.open({Entity:"Accounts",RecordID:agencyId})
        })


    })
    ZOHO.embeddedApp.init()
});
