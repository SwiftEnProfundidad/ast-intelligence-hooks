#!/usr/bin/env node
import { execSync } from 'child_process';

interface NotificationOptions {
    title: string;
    message: string;
    subtitle?: string;
    sound?: string;
}

export function sendMacOSNotification(options: NotificationOptions): void {
    const { title, message, subtitle, sound = 'default' } = options;

    const subtitlePart = subtitle ? `subtitle "${subtitle.replace(/"/g, '\\"')}"` : '';
    const soundPart = sound ? `sound name "${sound}"` : '';

    const script = `
        display notification "${message.replace(/"/g, '\\"')}" \
            with title "${title.replace(/"/g, '\\"')}" \
            ${subtitlePart} \
            ${soundPart}
    `.trim();

    try {
        execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
    } catch (err) {
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        process.exit(1);
    }

    const title = args[0];
    const message = args[1];
    const subtitle = args[2];
    const sound = args[3] || 'default';

    sendMacOSNotification({ title, message, subtitle, sound });
}
