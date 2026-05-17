import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { APP_NAME } from "@/config/constants";

interface VerifyEmailProps {
  verifyUrl: string;
  name: string;
}

export function VerifyEmail({ verifyUrl, name }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your {APP_NAME} email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Verify your email</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Thanks for signing up. Please confirm your email address by clicking the button
            below.
          </Text>
          <Button href={verifyUrl} style={button}>
            Verify email
          </Button>
          <Text style={muted}>
            This link expires in 24 hours. If you did not create an account, you can ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "32px", maxWidth: "520px" };
const heading = { fontSize: "22px", fontWeight: "600", color: "#111" };
const text = { fontSize: "14px", lineHeight: "24px", color: "#444" };
const muted = { color: "#71717a", fontSize: "12px", marginTop: "24px" };
const button = {
  backgroundColor: "#2563eb",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: "600",
  textDecoration: "none",
};

export default VerifyEmail;
