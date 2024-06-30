// Example train schedule in minutes past midnight
const trainSchedule = [
    363, 379, 395, 409,   // 6:03, 6:19, 6:35, 6:49
    423, 439, 455, 472,   // 7:03, 7:19, 7:35, 7:52
    482, 494, 506, 518, 530, // 8:02, 8:14, 8:26, 8:38, 8:50
    542, 561, 580, 597,   // 9:02, 9:21, 9:40, 9:57
    610, 628, 646,        // 10:10, 10:28, 10:46
    664, 682, 700, 718,   // 11:04, 11:22, 11:40, 11:58
    736, 754, 772,        // 12:16, 12:34, 12:52
    796, 814, 832,        // 13:16, 13:34, 13:52
    850, 868, 886,        // 14:10, 14:28, 14:46
    904, 922, 940, 958,   // 15:04, 15:22, 15:40, 15:58
    976, 994, 1010,       // 16:16, 16:34, 16:50
    1023, 1035, 1048, 1061, 1073, // 17:03, 17:15, 17:28, 17:41, 17:53
    1086, 1099, 1111, 1124, 1137, // 18:06, 18:19, 18:31, 18:44, 18:57
    1150, 1165, 1183,     // 19:10, 19:25, 19:43
    1204, 1222, 1240, 1258, // 20:04, 20:22, 20:40, 20:58
    1272, 1290, 1308,     // 21:12, 21:30, 21:48
    1326, 1344, 1359, 1374, // 22:06, 22:24, 22:39, 22:54
    1389, 1406, 1422, 1437 // 23:09, 23:26, 23:42, 23:57
];

// Function to get the current time in minutes past midnight
function getCurrentTimeInMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

// Function to find the next train time
function getNextTrainTime() {
    const currentTime = getCurrentTimeInMinutes();
    for (let time of trainSchedule) {
        if (time > currentTime) {
            return time;
        }
    }
    // If no more trains today, return the first train of the next day
    return trainSchedule[0] + 1440; // 1440 minutes in a day
}

// Function to update the countdown
function updateCountdown() {
    const currentTime = getCurrentTimeInMinutes();
    const nextTrainTime = getNextTrainTime();
    const timeLeft = nextTrainTime - currentTime;
    const timeLeftElement = document.getElementById('time-left');
    
    timeLeftElement.textContent = timeLeft;

    if (timeLeft < 10) {
        timeLeftElement.style.color = 'red';
    } else {
        timeLeftElement.style.color = 'black';
    }
}

// Update the countdown every minute
setInterval(updateCountdown, 60000);

// Initial update
updateCountdown();
