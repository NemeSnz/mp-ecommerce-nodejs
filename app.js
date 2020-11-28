const express = require('express');
const exphbs  = require('express-handlebars');
const mercadopago = require ('mercadopago');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || '';
const EXTERNAL_REFERENCE = process.env.EXTERNAL_REFERENCE || '';

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
  integrator_id: process.env.INTEGRATOR_ID,
});

var app = express();

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (_req, res) {
    res.render('home');
});

app.get('/success', (req, res) => {
  console.log('Sucess', req.query);
  res.render('success', req.query);
});

app.get('/pending', (req, res) => {
  console.log('Pending', req.query);
  res.render('pending', req.query);
});

app.get('/failure', (req, res) => {
  console.log('failure', req.query);
  res.render('failure', req.query);
});

app.post('/hook', (req) => {
  console.log('Webhook!!!', req.body);
  req.status(200).end();
});

app.get('/detail', async(req, res, next) => {
    const { img, title, price, unit } = req.query;
    const preference = {
        items: [
            {
                id: '1234',
                description: 'Dispositivo móvil de Tienda e-commerce',
                picture_url: img,
                quantity: Number.parseInt(unit),
                currency_id: 'MXN',
                unit_price: Number(price),
                title,
            },
        ],
        payer: {
            name: 'Lalo',
            surname: 'Landa',
            email: 'test_user_81131286@testuser.com',
            phone: {
                area_code: '52',
                number: 5549737300,
            },
            address: {
                street_name: 'Insurgentes Sur',
                street_number: 1602,
                zip_code: '03940',
            },
        },
        payment_methods: {
            excluded_payment_methods: [
                {
                    id: 'amex',
                }
            ],
            excluded_payment_types: [
                {
                    id: 'atm',
                },
            ],
            installments: 6,
        },
        notification_url: `${SITE_URL}/hook`,
        back_urls: {
            success: `${SITE_URL}/success`,
            failure: `${SITE_URL}/failure`,
            pending: `${SITE_URL}/pending`,
        },
        auto_return: 'approved',
        external_reference: EXTERNAL_REFERENCE,
    };
    try {
        const { body } = await mercadopago.preferences.create(preference);
        const { init_point, sandbox_init_point } = body;
        console.log('data_preference_id', body.id, body.init_point);
        res.render('detail', {...req.query, init_point, sandbox_init_point });
    }
    catch(e) {
        return next(e);
    }
});

app.listen(port, () => console.log(`Server ready at http://localhost:${port}`));
