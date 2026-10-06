import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

type Transport = ReturnType<typeof nodemailer.createTransport>;
let transport: Transport | null = null;

function getTransport(): Transport | null {
	if (!env.SMTP_HOST) return null;
	transport ??= nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: Number(env.SMTP_PORT ?? 587),
		secure: env.SMTP_SECURE === 'true',
		auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? '' } : undefined
	});
	return transport;
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function sendConfirmationEmail(to: string, username: string, link: string): Promise<void> {
	const transporter = getTransport();
	if (!transporter) {
		console.log(`[mail] SMTP not configured\n    confirmation link for ${to} : ${link}`);
		return;
	}

	await transporter.sendMail({
		from: env.MAIL_FROM || 'Dashboard <no-reply@dashboard.local>',
		to,
		subject: 'Confirm your registration on the Dashboard',
		text: `Hello ${username},\n\nPlease confirm your registration by clicking this link (valid for 24 hrs) :\n${link}\n`,
		html: `<p>Bonjour ${escapeHtml(username)},</p><p><a href="${escapeHtml(link)}">Confirm my registration</a> (valid for 24 hrs).</p>`
	});
}
