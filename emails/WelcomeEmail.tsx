import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { APP_NAME } from "@/config/constants";

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {APP_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to {APP_NAME}</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Your account has been created. Sign in to start building your SaaS product.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "24px", maxWidth: "560px" };
const heading = { fontSize: "24px", fontWeight: "600", color: "#111" };
const text = { fontSize: "14px", lineHeight: "24px", color: "#444" };

export default WelcomeEmail;
