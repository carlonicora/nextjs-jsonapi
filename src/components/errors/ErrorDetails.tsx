"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shadcnui";

export function ErrorDetails({ title, message, code }: { title?: string; message: string; code: number }) {
  if (code === 403)
    return (
      <div className="w-xl max-w-xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-foreground flex flex-col items-center gap-y-4 pb-10 text-4xl">
              <Image src="/phlow-logo.webp" alt="Phlow" width={100} height={100} priority />
              {/* <div>{code}</div> */}
              <div>Unauthorised</div>
            </CardTitle>
            <CardDescription className="text-center text-lg">
              We are sorry, but you are not allowed to access this content.
            </CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    );

  return (
    <div className="w-xl max-w-xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-foreground flex flex-col items-center gap-y-4 pb-10 text-center text-4xl">
            <Image src="/phlow-logo.webp" alt="Phlow" width={100} height={100} priority />
            <div>{code}</div>
            <div>{title}</div>
          </CardTitle>
          <CardDescription className="text-center text-lg">{message}</CardDescription>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    </div>
  );
}
