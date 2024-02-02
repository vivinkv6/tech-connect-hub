function getGreeting() {
  // Get the current time in server
  var serverTime = new Date();

  // Convert Server time to India time
  var indiaTime = new Date(serverTime.getTime() + 5.5 * 60 * 60 * 1000);

  // Get the current hour in India time
  var currentHour = indiaTime.getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return "Good Morning";
  } else if (currentHour >= 12 && currentHour < 18) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
}

module.exports = getGreeting;
