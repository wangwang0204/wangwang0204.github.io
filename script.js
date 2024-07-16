// [[weekend schedule], [weekday schedule]]
const trainSchedule = [
    [
        363, 379, 395, 412, 430, 448, 466, 484, 502, 520, 
        538, 556, 574, 592, 610, 628, 646, 664, 682, 700, 
        718, 736, 754, 772, 790, 808, 826, 844, 862, 880, 
        898, 916, 934, 952, 970, 988, 1006, 1024, 1042, 1060, 
        1078, 1096, 1114, 1132, 1150, 1168, 1186, 1204, 1222, 1240, 
        1258, 1276, 1292, 1310, 1326, 1342, 1357, 1372, 1387, 1402, 
        1417
    ], 
    [   
        363, 379, 395, 409, 422, 434, 446, 458, 470, 482,
        494, 506, 521, 540, 557, 570, 582, 594, 606, 618, 
        630, 642, 654, 666, 678, 690, 702, 714, 726, 735, 
        748, 761, 774, 786, 799, 811, 825, 840, 852, 865, 
        879, 891, 904, 916, 928, 940, 950, 961, 975, 984, 
        996, 1010, 1024, 1036, 1048, 1059, 1071, 1084, 1096, 1108, 
        1119, 1130, 1142, 1154, 1166, 1177, 1186, 1197, 1209, 1221, 
        1233, 1242, 1254, 1266, 1278, 1290, 1302, 1314, 1324, 1339,
        1351, 1365, 1378, 1390, 1404, 1417
    ]]


// Function to get the current time in minutes past midnight
function getCurrentTimeInMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function getIsWeekDay() {
    const now = new Date();
    const weekdays = [1, 2, 3, 4, 5]
    return Number(weekdays.includes(now.getDay())) // 0-6 sunday, sat
}

// Function to find the next train time
function getNextTrainTime() {
    const isWeekDay = getIsWeekDay()
    scheduleToday = trainSchedule[isWeekDay]
    const currentTime = getCurrentTimeInMinutes();
    for (let [idx, time] of scheduleToday.entries()) {
        if (time > currentTime) {
            return [time, scheduleToday[idx+1], scheduleToday[idx+2], scheduleToday[idx+3]]
        }
    }
    // If no more trains today, return the first train of the next day
    return trainSchedule[isWeekDay][0] + 1440; // 1440 minutes in a day
}

// Function to update the countdown
function updateCountdown() {

    const currentTime = getCurrentTimeInMinutes();
    const nextFourTrain = getNextTrainTime()


    const timeLeft = nextFourTrain.map(time => [Math.floor((time - currentTime) / 60), (time - currentTime) % 60])
    const timeLeftElement = document.getElementById('time-left');
    const hours = timeLeft[0][0]
    const minutes = timeLeft[0][1]

    timeLeftElement.textContent = `距離發車還有${hours}h ${minutes}m`;
    timeLeftElement.style.color = minutes < 10 ? 'red' : 'black';  // 三元運算符 condition ? true : false

    // three more train
    const minutes1 = timeLeft[1][1]
    const minutes2 = timeLeft[2][1]
    const minutes3 = timeLeft[3][1]
    const threeMoreTrainElement = document.getElementById('three-more-train');
    threeMoreTrainElement.textContent = `下三班車將在 ${minutes1}, ${minutes2}, ${minutes3}m 之後抵達`
  }

// Update the countdown every minute
setInterval(updateCountdown, 60000);

// Initial update
updateCountdown();
