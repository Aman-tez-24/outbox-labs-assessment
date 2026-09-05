import nodemailer from "nodemailer";

export async function createEtherealAccount() {
  return nodemailer.createTestAccount();
}