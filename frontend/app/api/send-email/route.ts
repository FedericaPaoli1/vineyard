import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, threshold, currentDD, year } = await request.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const displayYear = year || new Date().getFullYear();

    const mailOptions = {
      from: 'Vineyard Dashboard <noreply@vineyard.com>',
      to: email,
      subject: `ALLARME VIGNETO ${displayYear}: Soglia ${threshold} DD Superata!`,
      text: `Attenzione!\n\nRelativamente all'anno corrente ${displayYear}, il modello agrometeorologico ha rilevato che il valore attuale dei Gradi-Giorno (${currentDD.toFixed(2)} DD) ha superato la tua soglia di allarme impostata a ${threshold} DD.\n\nAccedi alla dashboard per maggiori dettagli.`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email inviata con successo' }, { status: 200 });
  } catch (error) {
    console.error('Errore invio email:', error);
    return NextResponse.json({ error: 'Errore durante l\'invio' }, { status: 500 });
  }
}