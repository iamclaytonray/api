import { SendEmailRequest, SES } from '@aws-sdk/client-ses';
import { config } from 'dotenv';
import * as hbs from 'handlebars';
import mjml = require('mjml');

import { confirmEmailTemplate } from './templates/confirmEmail';
import { forgotPasswordTemplate } from './templates/forgotPassword';
import { resetPasswordTemplate } from './templates/resetPassword';

config();

const ses = new SES({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: 'us-east-1',
});

const isEqual = (a: any, b: any, opts: any) => {
  if (a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
};

hbs.registerHelper('ifEquals', isEqual);

const templates: any = {
  confirmEmail: {
    subject: 'Confirm Your Email Address',
    template: confirmEmailTemplate,
  },
  forgotPassword: {
    subject: 'Reset Your Password',
    template: forgotPasswordTemplate,
  },
  resetPassword: {
    subject: 'Password Reset Successful',
    template: resetPasswordTemplate,
  },
};

interface Args {
  type: 'confirmEmail' | 'forgotPassword' | 'resetPassword';
  emails: string[];
  url: string;
}

export const sendEmail = async ({ type, emails, url }: Args) => {
  try {
    const templateArgs = {
      url,
    };

    const mjmlTemplate = hbs.compile(templates[type].template);
    const finalMjml = mjmlTemplate(templateArgs);
    const finalHtml = mjml(finalMjml, {
      keepComments: false,
      minify: true,
      validationLevel: 'strict',
    });

    const params: SendEmailRequest = {
      Destination: {
        ToAddresses: emails,
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: finalHtml.html,
          },
          Text: {
            Charset: 'UTF-8',
            Data: finalHtml.html,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: templates[type].subject,
        },
      },
      Source: 'iamclaytonray@gmail.com',
    };

    await ses.sendEmail(params);
  } catch (error) {
    return error;
  }
};
