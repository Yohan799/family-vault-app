import { supabase } from '@/integrations/supabase/client';

// Helper to send push notification via edge function
export const sendPushNotification = async (
    userId: string,
    title: string,
    body: string,
    type: string = 'general',
    data: Record<string, string> = {}
): Promise<boolean> => {
    try {
        const { error } = await supabase.functions.invoke('send-push-notification', {
            body: {
                user_id: userId,
                title,
                body,
                data: { ...data, type },
            },
        });

        if (error) {
            console.error('Push notification error:', error);
            return false;
        }

        console.log(`Push notification sent: ${title}`);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};

// Pre-defined notification templates
export const NotificationTemplates = {
    passwordChanged: (userId: string) =>
        sendPushNotification(
            userId,
            '🔐 Password Changed',
            'Your password was successfully updated. If this wasn\'t you, secure your account immediately.',
            'security'
        ),

    twoFactorEnabled: (userId: string) =>
        sendPushNotification(
            userId,
            '🛡️ Two-Factor Auth Enabled',
            'Your account is now protected with two-factor authentication.',
            'security'
        ),

    twoFactorDisabled: (userId: string) =>
        sendPushNotification(
            userId,
            '⚠️ Two-Factor Auth Disabled',
            'Two-factor authentication has been turned off for your account.',
            'security'
        ),

    nomineeVerified: (userId: string, nomineeName: string) =>
        sendPushNotification(
            userId,
            '✅ Nominee Verified',
            `${nomineeName} has verified their email and is now a trusted nominee.`,
            'nominee',
            { nominee_name: nomineeName }
        ),

    nomineeAdded: (userId: string, nomineeName: string) =>
        sendPushNotification(
            userId,
            '👥 Nominee Added',
            `${nomineeName} has been added to your nominee list. A verification email has been sent.`,
            'nominee',
            { nominee_name: nomineeName }
        ),

    newDeviceLogin: (userId: string, deviceName: string) =>
        sendPushNotification(
            userId,
            '🔐 New Device Login',
            `New login from ${deviceName} at ${new Date().toLocaleTimeString()}. If this wasn\'t you, secure your account.`,
            'new_device_login',
            { device_name: deviceName }
        ),

    timeCapsuleCreated: (userId: string, title: string, releaseDate: string) =>
        sendPushNotification(
            userId,
            '📦 Time Capsule Created',
            `"${title}" is scheduled to release on ${releaseDate}.`,
            'time_capsule',
            { capsule_title: title }
        ),

    documentShared: (userId: string, documentName: string, sharedWith: string) =>
        sendPushNotification(
            userId,
            '📄 Document Shared',
            `"${documentName}" has been shared with ${sharedWith}.`,
            'document',
            { document_name: documentName, shared_with: sharedWith }
        ),
};
