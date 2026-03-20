import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Inicializamos los poderes de administrador para escribir en Firestore
admin.initializeApp();
const db = admin.firestore();

// Claves de Stripe desde variables de entorno
// Configúralas creando un archivo functions/.env con:
// STRIPE_SECRET_KEY=sk_test_...
// STRIPE_WEBHOOK_SECRET=whsec_...
// O con: firebase functions:secrets:set STRIPE_SECRET_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!stripeSecretKey) {
    console.warn('⚠️ STRIPE_SECRET_KEY no está configurada. Crea un archivo functions/.env con STRIPE_SECRET_KEY=sk_test_...');
}

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia' as any,
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        console.error('No stripe-signature header');
        res.status(400).send('Missing stripe-signature header');
        return;
    }

    if (!webhookSecret) {
        console.error('⚠️ webhook_secret no está configurado. Agrega STRIPE_WEBHOOK_SECRET a functions/.env');
        res.status(500).send('Webhook secret not configured');
        return;
    }

    let event: Stripe.Event;

    try {
        // Verificamos que el mensaje realmente venga de Stripe
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Error de firma de Webhook: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Si el evento es un pago completado con éxito
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Recuperamos el ID de la usuaria
        const userId = session.client_reference_id;
        console.log(`Checkout completado. UserId: ${userId}, Amount: ${session.amount_total}, Status: ${session.payment_status}`);

        if (userId) {
            // Verificar si es un pago gratuito (cupón 100%)
            const isFree = session.amount_total === 0 || session.payment_status === 'no_payment_required';

            let isBookPurchase = false;
            let isProPurchase = false;

            // Método 1: Usar metadata que se pasaron desde el frontend
            if (session.metadata?.productType) {
                isBookPurchase = session.metadata.productType === 'book';
                isProPurchase = session.metadata.productType === 'pro';
                console.log(`Tipo de producto por metadata: ${session.metadata.productType}`);
            }

            // Método 2: Intentar obtener line_items expandidos desde la API
            if (!isBookPurchase && !isProPurchase) {
                try {
                    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                        expand: ['line_items', 'line_items.data.price'],
                    });

                    const lineItems = expandedSession.line_items?.data;
                    if (lineItems && lineItems.length > 0) {
                        for (const item of lineItems) {
                            const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
                            const productId = typeof item.price === 'object' ? 
                                (typeof item.price?.product === 'string' ? item.price.product : (item.price?.product as any)?.id) : null;
                            
                            console.log(`Line item - PriceId: ${priceId}, ProductId: ${productId}`);

                            // Buscar por nombre del producto o descripción
                            const description = (item.description || '').toLowerCase();
                            if (description.includes('libro') || description.includes('book')) {
                                isBookPurchase = true;
                            } else if (description.includes('pro') || description.includes('premium') || description.includes('mensual') || description.includes('anual') || description.includes('ciclo')) {
                                isProPurchase = true;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error expandiendo line_items:', error);
                }
            }

            // Método 3: Si es gratuito (cupón 100%), asumir PRO
            if (!isBookPurchase && !isProPurchase && isFree) {
                isProPurchase = true;
                console.log('Pago gratuito (cupón 100%). Asignando PRO por defecto.');
            }

            // Método 4: Si todavía no se sabe qué es, asumir PRO para cualquier checkout exitoso
            if (!isBookPurchase && !isProPurchase) {
                isProPurchase = true;
                console.log('Tipo de producto no identificado. Asignando PRO por defecto.');
            }

            const userRef = db.collection('users').doc(userId);

            try {
                if (isBookPurchase) {
                    await userRef.update({ hasBook: true });
                    console.log(`✅ Candado del Libro abierto para el usuario: ${userId}`);
                }
                if (isProPurchase) {
                    await userRef.update({ isPremium: true });
                    console.log(`✅ Candado PRO abierto para el usuario: ${userId}`);
                }
            } catch (updateError) {
                console.error(`Error actualizando usuario ${userId}:`, updateError);
                // Si el documento no existe, crearlo
                try {
                    await userRef.set({
                        isPremium: isProPurchase,
                        hasBook: isBookPurchase,
                    }, { merge: true });
                    console.log(`✅ Documento creado/actualizado con merge para: ${userId}`);
                } catch (setError) {
                    console.error(`Error crítico al crear documento: ${setError}`);
                }
            }
        } else {
            console.warn('⚠️ checkout.session.completed sin client_reference_id. No se puede identificar al usuario.');
        }
    }

    // Le respondemos a Stripe que todo salió bien
    res.status(200).send('Recibido por Obsidiana');
});