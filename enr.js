const POP3Client = require('poplib');
const simpleParser = require('mailparser').simpleParser

const port = 995;
const server = 'pop3.lolipop.jp';
const username = 'airbnb@r2a.jp';
const password = '1234_Gaga0203';
const options = {
    tlserrs: false,
    enabletls: true,
    debug: false
}
const client = new POP3Client(port, server, options);
const types = ['件名：', 'RE:', 'Reservation Confirmed', '日の空きを問い合わせる', '予約確定 ', 'さんが予約変更をご希望です', 'Pending:', '保留中:', 'Inquiry for', '予約が確定しました'];
var today = new Date(); 
var yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

client.on("error", function(err) {

    if (err.errno === 111) console.log("Unable to connect to server");
    else console.log("Server error occured");

    console.log(err);

});

client.on("connect", function() {

    console.log("CONNECT success");
    client.login(username, password);

});

client.on("invalid-state", function(cmd) {

    console.log("Invalid state. Your tried calling " + cmd);

});

client.on("login", function(status, rawdata) {

    if (status) {

        console.log("LOGIN/PASS success");
        client.list();

    } else {

        console.log("LOGIN/PASS failed");
        client.quit();

    }
});

client.on("locked", function(cmd) {

    console.log("Current command has not finished yet. You tried calling " + cmd);

});

client.on("list", function(status, msgcount, msgnumber, data, rawdata) {

    if (status === false) {

        console.log("LIST failed");
        client.quit();

    } else if (msgcount > 0) {

        totalmsgcount = msgcount;
        currentmsg = 1;
        enrcount = 0;
        console.log("LIST success with " + msgcount + " message(s)");
        client.retr(currentmsg);

    } else {
        
        console.log("LIST success with 0 messages");
        client.quit();

    }
});

client.on("retr", function(status, msgnumber, data, rawdata) {

    if (status === true) {

        console.log("RETR success " + msgnumber);

        simpleParser(rawdata, (err, mail) => {

            if (err) {

                console.log(err);
                client.quit();

            } else {

                try {
                    console.log(mail.date.getMonth() + '/' + mail.date.getDate() + '\n');
                    console.log(mail.subject);

                    for(var i = 0; i < types.length; i++) {
                        if (mail.subject.toLowerCase().indexOf(types[i].toLowerCase()) > -1) {
                            needsreply = true;
                            break;
                        } else {
                            needsreply = false;
                        }
                    }
    
                    if (needsreply === true && yesterday.getMonth() === mail.date.getMonth() && yesterday.getDate() === mail.date.getDate()) {
                        enrcount += 1;
                        console.log("Subject filter match, ENR count updated");
                    } else {
                        console.log("Email not needed, discarded");
                    }
                }

                catch(err) {
                    console.log(err.message);
                }

            }
        });

        currentmsg += 1;

        if (currentmsg > totalmsgcount) {

            console.log(enrcount);
            client.quit();

        } else {

            client.retr(currentmsg);

        }

    } else {

        console.log("RETR failed for msgnumber " + msgnumber);
        client.rset();

    }

});

client.on("rset", function(status, rawdata) {

    client.quit();

});

client.on("quit", function(status, rawdata) {

    if (status === true) console.log("QUIT success");
    else console.log("QUIT failed");

});