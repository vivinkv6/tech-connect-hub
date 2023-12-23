function usernameExtractor(email) {
    return email.split('@')[0];
}

module.exports=usernameExtractor;