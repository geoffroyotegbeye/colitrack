import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Clock, 
  Plane, 
  Ship, 
  Truck, 
  CheckCircle2,
  ArrowLeft,
  Info,
  AlertCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SHIPPING_MODES = [
  {
    mode: "Express",
    icon: Plane,
    delay: "3 à 5 jours",
    color: "text-success",
    bgColor: "bg-success/10",
    description: "Livraison ultra-rapide pour les urgences",
  },
  {
    mode: "Avion normal",
    icon: Plane,
    delay: "5 à 14 jours",
    color: "text-accent",
    bgColor: "bg-accent/10",
    description: "Bon équilibre entre délai et coût",
  },
  {
    mode: "Avion standard",
    icon: Plane,
    delay: "14 à 20 jours",
    color: "text-info",
    bgColor: "bg-info/10",
    description: "Économique par avion",
  },
  {
    mode: "Bateau",
    icon: Ship,
    delay: "35 à 50 jours",
    color: "text-warning",
    bgColor: "bg-warning/10",
    description: "Solution la plus économique pour gros volumes",
  },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: "Confirmation de la commande",
    delay: "1 – 2 jours",
    icon: CheckCircle2,
    description: "Nous contactons les fournisseurs en Chine et validons l'achat avec le client.",
  },
  {
    step: 2,
    title: "Préparation / Production",
    delay: "2 – 5 jours",
    icon: Package,
    description: "Les produits sont préparés ou fabriqués selon les spécifications.",
    note: "Ce délai varie selon la nature du produit",
  },
  {
    step: 3,
    title: "Transport interne en Chine",
    delay: "2 – 3 jours",
    icon: Truck,
    description: "Les colis sont envoyés depuis le fournisseur vers notre entrepôt logistique.",
  },
  {
    step: 4,
    title: "Attente de départ / Groupage",
    delay: "2 – 3 jours",
    icon: Package,
    description: "Regroupement des colis et préparation de l'expédition internationale.",
  },
  {
    step: 5,
    title: "Transport international",
    delay: "Variable",
    icon: Plane,
    description: "Expédition vers le pays de destination selon le mode choisi.",
  },
];

export default function ProcessPage() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary border-b border-primary-foreground/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/tracking">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
              <Package className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-bold font-heading text-primary-foreground">Processus de commande</h1>
              <p className="text-xs text-primary-foreground/60">Chine → Bénin & Afrique</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Introduction */}
        <section>
          <Card className="bg-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 shrink-0">
                  <Info className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-heading mb-2">
                    Notre engagement
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    En tant qu'agence, nous nous occupons de passer les commandes en Chine 
                    pour le compte de nos clients et d'organiser toute la logistique jusqu'à 
                    la livraison finale. Voici le déroulement typique d'une commande.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modes de transport */}
        <section>
          <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Modes de transport & délais
          </h2>
          <p className="text-muted-foreground mb-4">
            Le délai total dépend principalement du mode de transport choisi :
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {SHIPPING_MODES.map((mode) => (
              <Card 
                key={mode.mode}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMode === mode.mode ? "ring-2 ring-accent" : ""
                }`}
                onClick={() => setSelectedMode(mode.mode)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mode.bgColor} shrink-0`}>
                      <mode.icon className={`h-6 w-6 ${mode.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold font-heading">{mode.mode}</h3>
                        <span className={`text-sm font-bold ${mode.color}`}>{mode.delay}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Cas particulier :</strong> Lorsque le produit est déjà disponible 
              en stock et envoyé en express, la livraison peut être très rapide 
              (<span className="text-success font-medium">2 à 5 jours</span>).
            </p>
          </div>
        </section>

        {/* Étapes du processus */}
        <section>
          <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            Étapes du processus
          </h2>

          <div className="space-y-4">
            {PROCESS_STEPS.map((step, index) => (
              <Card key={step.step} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Numéro d'étape */}
                    <div className="w-16 sm:w-20 bg-primary flex items-center justify-center shrink-0">
                      <span className="text-2xl font-black font-heading text-primary-foreground">
                        {String(step.step).padStart(2, '0')}
                      </span>
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0`}>
                          <step.icon className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                            <h3 className="font-semibold font-heading">{step.title}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              <Clock className="h-3 w-3 mr-1" />
                              {step.delay}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {step.note && (
                            <p className="text-xs text-muted-foreground/70 mt-2 italic">
                              * {step.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold font-heading mb-4">Questions fréquentes</h2>
          
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="delai-total" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                Quel est le délai total moyen d'une commande ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Le délai total varie entre <strong>7 jours</strong> (express avec stock disponible) 
                et <strong>60+ jours</strong> (bateau avec production). En moyenne, comptez 
                <strong> 15 à 25 jours</strong> pour un envoi avion standard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="disponibilite" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                Comment savoir si un produit est en stock ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Nous vérifions la disponibilité auprès du fournisseur lors de la confirmation 
                de commande. Si le produit n'est pas en stock, le délai de production 
                (2-5 jours supplémentaires) sera communiqué.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="groupage" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                Qu'est-ce que le groupage ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Le groupage consiste à regrouper plusieurs colis de différents clients 
                dans un même conteneur ou palette. Cela permet de réduire les coûts 
                de transport et d'optimiser les délais d'attente.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="suivi" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                Comment suivre ma commande ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Chaque commande dispose d'un numéro de suivi unique. Vous pouvez 
                consulter l'état de votre colis à tout moment sur notre page de suivi 
                ou recevoir des notifications par email à chaque changement de statut.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Résumé */}
        <section>
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold font-heading mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                En résumé
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Le délai total dépend surtout de trois facteurs :
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>La <strong>disponibilité du produit</strong> (stock ou production)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Le <strong>mode de transport</strong> choisi (express, avion, bateau)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>L'<strong>organisation logistique</strong> (groupage, dédouanement)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-muted-foreground mb-4">
            Prêt à passer commande ? Suivez votre colis en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/tracking">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                <Package className="h-4 w-4 mr-2" />
                Suivre un colis
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Espace client
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
