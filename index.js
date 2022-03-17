const Imap = require('imap');
const Sentry = require('@sentry/node');
const Tracing = require("@sentry/tracing");
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
  isMailer = false
  var lastMail = null
  try {
    const imap = new Imap(imapConfig);
    try{
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['ALL', ['TO', "onenew553+"+req.params.id+"@gmail.com"]], (err, results) => {
          if(err || !results || !results.length){
            if (err) console.log(err.message)
            res.send({
              sub:"Nothings...",
              html:"<h1>Nothings in your mail</h1>",
              from:"Admin@gmail.com"
            })
            isMailer = true
          } else {
          
          const f = imap.fetch(results, {bodies: ''});
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                // const {from, subject, textAsHtml, text} = parsed;
                if (parsed.headers.get('delivered-to').text === "onenew553+"+req.params.id+"@gmail.com"){
                  console.log(parsed.headers.get('subject'));
                  console.log(parsed.headers.get('from').text);
                  console.log(parsed.html)
                  lastMail = parsed
                  
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
          }
        });
      });
    });

    imap.once('error', err => {
      console.log(err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
      if(isMailer == false){
        if(lastMail){
          res.send({
            sub : lastMail.headers.get('subject'),
            html : lastMail.html,
            from : lastMail.headers.get('from').text
          })
        }
        isMailer = true
      }
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred');
  }
  } catch(e){
    //pass
  }
};



const express = require("express")
const app = express()
const cors = require("cors")

Sentry.init({
  dsn: "https://def87d0ffbef46c9bc32cf34613843ae@o1169803.ingest.sentry.io/6263007",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


app.use(cors({
  "origin":"*"
}))

app.get('/',(req,res) => {
  res.sendFile(__dirname + "/html.html")
})


app.get("/get/:id",getEmails)


// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});


app.listen(process.env.PORT || 3000,() => console.log("Statesd"))
