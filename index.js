const Imap = require('imap');
const {simpleParser} = require('mailparser');
const imapConfig = {
  user: 'onenew553@gmail.com',
  password: 'lbfufgyqbtoovxmr',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
};


const getEmails = (req,res) => {
  try {
    const imap = new Imap(imapConfig);
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['ALL', ['SINCE', new Date()]], (err, results) => {
          const f = imap.fetch(results, {bodies: ''});
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                // const {from, subject, textAsHtml, text} = parsed;
                if (parsed.headers.get('delivered-to').text === "onenew553+"+req.params.id+"@gmail.com"){
                  console.log(parsed.headers.get('subject'));
                  console.log(parsed.headers.get('from').text);
                  console.log(parsed.html)
                  res.send({
                    sub : parsed.headers.get('subject'),
                    html : parsed.html,
                    from : parsed.headers.get('from').text
                  })
                  return;
                }
                /* Make API call to save the data
                   Save the retrieved data into a database.
                   E.t.c
                */
              });
            });
          });
          f.once('error', ex => {
            return Promise.reject(ex);
          });
          f.once('end', () => {
            console.log('Done fetching all messages!');
            imap.end();
            // try{
            //   res.send("Nothings.")
            //   return;
            // } catch(e) {
            //   //pass
            // }
          });
        });
      });
    });

    imap.once('error', err => {
      console.log(err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred');
  }
};



const express = require("express")
const app = express()
const cors = require("cors")

app.use(cors({
  "origin":"*"
}))

app.get('/',(req,res) => {
  res.sendFile(__dirname + "/html.html")
})


app.get("/get/:id",getEmails)



app.listen(process.env.PORT || 3000,() => console.log("Statesd"))
