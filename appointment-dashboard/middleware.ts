import { NextResponse } from "next/server";

export function middleware(request: any) {
  const { pathname } = request.nextUrl;

  // Get access_token from cookies
  const accessToken = request.cookies.get("token")?.value;

  const workspace = pathname.split("/")[1];
  // const workspace = request.cookies.get("workspace")?.value || "orbittech";

  // Define public pages
  const isLoginPage = pathname === `/${workspace}/login`;
  const isOnboardingPage = pathname === `/onboarding`;
  const isForgotPasswordPage = pathname === `/${workspace}/forgot-password`;

  const isPublicPage = isLoginPage || isOnboardingPage || isForgotPasswordPage;
  const isProtected = !isPublicPage && !pathname.startsWith("/_next");

  // 🔐 If not authenticated, redirect to login
  if (!accessToken && isProtected) {
    if (workspace === "onboarding" || pathname === "/") {
      return NextResponse.redirect(new URL(`/onboarding`, request.url));
    } else {
      return NextResponse.redirect(new URL(`/${workspace}/login`, request.url));
    }
  }

  // ✅ If authenticated and on login page, redirect to workspace root
  if (
    accessToken &&
    (isLoginPage || isOnboardingPage || isForgotPasswordPage)
  ) {
    return NextResponse.redirect(new URL(`/${workspace}`, request.url));
  }

  // ✅ If authenticated and on other public page, do nothing (let the page handle redirect)
  if (accessToken && (isOnboardingPage || isForgotPasswordPage)) {
    // return NextResponse.next();
    return NextResponse.redirect(new URL(`/${workspace}`, request.url));
  }

  return NextResponse.next();
}
