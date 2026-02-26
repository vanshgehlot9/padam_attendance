export default function MobileAppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="mx-auto w-full max-w-md min-h-[100dvh] bg-white relative shadow-2xl flex flex-col md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-[2rem] overflow-hidden border border-slate-200">
            <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden hide-scrollbar">
                {children}
            </main>
        </div>
    );
}
