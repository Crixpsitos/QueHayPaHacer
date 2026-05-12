"use client"

import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { NavLink } from "../../ui/navigation/NavLink";
import { Button } from "../../ui/button/button";
import { NavbarAccountMenu } from "./NavbarAccountMenu";
import { Container } from "../shared/Container";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu";


export const Navbar = () => {
    const routes = [
        { name: "Inicio", href: "/" },
        { name: "Eventos", href: "/events" },
        { name: "Donde parchar?", href: "/where-to-party" },
        { name: "Contactanos", href: "/contact" },
    ]

  return (
        <header className="border-b border-zinc-200 bg-background/95 text-foreground backdrop-blur dark:border-zinc-800">
            <Container as="nav" aria-label="Principal" className="text-sm font-medium">
                <div className="flex h-16 items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr]">
                    <div className="justify-self-start">
                    <Link href="/" aria-label="Ir al inicio" className="font-semibold tracking-tight text-zinc-800 transition-colors hover:text-zinc-950 dark:text-zinc-100 dark:hover:text-white">
                        Que Hay Pa Hacer?
                    </Link>
                    </div>

                    <ul className="hidden items-center justify-self-center gap-1 md:flex" role="list">
                        {routes.map((route) => (
                            <li key={route.name}>
                                <NavLink
                                    href={route.href}
                                    className="rounded-full px-3 py-2 text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100"
                                    activeClassName="bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100"
                                >
                                    {route.name}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center justify-self-end gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon-sm" className="md:hidden" aria-label="Abrir menu de navegacion">
                                    <Menu className="size-4" aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={10} className="w-56 md:hidden">
                                {routes.map((route) => (
                                    <DropdownMenuItem asChild key={route.name}>
                                        <Link href={route.href}>{route.name}</Link>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="bg-zinc-900 text-white focus:bg-zinc-700 focus:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:focus:bg-zinc-300 dark:focus:text-zinc-900">
                                    <Link href="/events/create" className="font-semibold">
                                        Crear tu evento
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            asChild
                            variant="outline"
                            className="hidden! border-transparent bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 hover:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 md:inline-flex!"
                        >
                            <Link href="/events/create" className="inline-flex items-center gap-2">
                                <Plus className="size-4" aria-hidden="true" />
                                Crear tu evento
                            </Link>
                        </Button>

                        <NavbarAccountMenu />
                    </div>
                </div>
            </Container>
        </header>
  )
}
