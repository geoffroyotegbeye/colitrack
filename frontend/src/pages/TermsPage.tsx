import { Link } from "react-router-dom";
import { ArrowLeft, Clock, AlertTriangle, Package, CreditCard, Truck, Shield, Scale, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/tracking" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-heading text-foreground">Conditions Générales</h1>
            <p className="text-sm text-muted-foreground">Fonctionnement et réglementation</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <p className="text-foreground leading-relaxed">
              Les présentes conditions sont consultables sur le tableau d'affichage de notre espace attente.
              Tout transport de colis pour le compte d'un individu ou une entreprise est soumis aux conditions
              générales de fonctionnement que le propriétaire déclare accepter sans conditions.
            </p>
          </CardContent>
        </Card>

        {/* Horaires */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Horaires d'ouverture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="font-medium text-foreground">Lundi – Vendredi</span>
              <span className="text-muted-foreground">9h – 14h / 15h – 18h</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="font-medium text-foreground">Samedi</span>
              <span className="text-muted-foreground">9h – 15h (sans interruption)</span>
            </div>
          </CardContent>
        </Card>

        {/* Prestations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5 text-primary" />
              Prestations assurées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Nous sommes spécialisés dans le transport de marchandises depuis la <strong className="text-foreground">Chine, la France,
              les États-Unis et le Nigeria</strong> vers le <strong className="text-foreground">Bénin, le Togo et la Côte d'Ivoire</strong> par avion et par bateau.
            </p>
            <p>
              Nous sommes aussi spécialisés dans la recherche de fournisseurs, le paiement de fournisseurs et de
              commandes ainsi que le transfert de devises de / vers les pays ci-dessus cités.
            </p>
          </CardContent>
        </Card>

        {/* Marchandises prohibées */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Marchandises prohibées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                "Les batteries pures (powerbank, etc.) à cause des risques d'incendie",
                "Les drones ne peuvent être transportés de Chine par avion ou par bateau",
                "Les liquides (par bateau), articles inflammables, explosifs et produits dangereux",
                "Les compléments alimentaires et médicaments sans autorisation d'importation",
                "Les produits chimiques dangereux ou toxiques",
                "Les armes réelles ou répliques parfaites",
                "Les articles conditionnés sous forme de sprays",
                "Les téléphones et ordinateurs par voie maritime",
                "Les marchandises illégales ou réglementées par la loi du pays d'origine ou de destination",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-destructive shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic">
              En cas de doute, veuillez contacter le service client.
            </p>
          </CardContent>
        </Card>

        {/* Conditions tarifaires */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Conditions tarifaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Nous facturons <strong className="text-foreground">au kilo</strong> les colis expédiés par voie aérienne
              et <strong className="text-foreground">au volume</strong> ceux expédiés par voie maritime.
              Nos tarifs sont fixés à l'avance et ne peuvent être négociés à l'arrivée des colis à destination.
            </p>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm text-foreground">
                <strong>Note :</strong> La loi de finance 2023 du Bénin obligeant toutes les structures de transport
                de marchandise groupées à garder trace de toutes les informations liées aux propriétaires des
                marchandises transportées, une <strong>majoration de 10%</strong> sera appliquée à tous les clients
                ne disposant pas de numéro IFU renseigné dans leur compte.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sections en accordéon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Réglementation détaillée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="poids-volumetrique">
                <AccordionTrigger className="text-left">Poids volumétrique</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <p>
                    Il peut arriver que certaines marchandises aient un poids faible mais occupent beaucoup d'espace.
                    Dans ce cas, la facturation sera basée sur le <strong className="text-foreground">poids volumétrique</strong> plutôt
                    que le poids net de la marchandise.
                  </p>
                  <p className="mt-2">
                    Le poids volumétrique est le calcul de l'espace occupé par une marchandise dans le moyen utilisé
                    pour son expédition, en tenant compte de ses dimensions : largeur, longueur et hauteur du colis.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="avances">
                <AccordionTrigger className="text-left">Avances sur transport</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Une avance pourrait être exigée avant le transport de certains colis. Le client sera alors contacté
                  et notifié du montant à payer pour expédier son colis. Ce n'est qu'après le paiement que le colis
                  sera expédié.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reglement">
                <AccordionTrigger className="text-left">Modalités de règlement</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 text-muted-foreground">
                    {["Espèces", "Chèques", "Virements bancaires", "Dépôts mobile money"].map((m, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="declarations">
                <AccordionTrigger className="text-left">Déclarations de colis</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Tout colis expédié vers nous dispose d'un numéro de suivi qui vous sera communiqué soit par le
                    fournisseur soit par le site ou la plateforme sur lequel l'achat a été fait.
                  </p>
                  <p>
                    Ce numéro doit ensuite être enregistré par le propriétaire du colis sur notre plateforme accompagné
                    de toutes les informations relatives au contenu du colis.
                  </p>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                    <p><strong className="text-foreground">⚠️ Attention :</strong> En cas de déclaration erronée, les services de la
                    douane ont la capacité de retenir les colis et d'appliquer des amendes. Cette amende sera supportée par le client responsable.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                    <p><strong className="text-foreground">Majoration :</strong> Une majoration de <strong>60%</strong> sur les frais de transport
                    sera appliquée à tout colis n'ayant pas été enregistré par son propriétaire (contenu, quantité, valeur totale, image de l'article).</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="recuperation">
                <AccordionTrigger className="text-left">Récupération des colis</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Lorsqu'un colis arrive à destination, il est inventorié puis classé à notre entrepôt. Un message
                    de notification est envoyé au propriétaire afin qu'il puisse s'acquitter de sa facture et récupérer son ou ses colis.
                  </p>
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                    <p><strong className="text-foreground">Important :</strong> Le propriétaire de plusieurs colis arrivés simultanément
                    n'est pas autorisé à choisir lesquels retirer en priorité. Tous les colis doivent être retirés simultanément.</p>
                  </div>
                  <p>
                    Une fois les frais payés, le propriétaire doit vérifier l'intégrité de son colis avant le départ de notre entrepôt.
                    Tout dommage ou manquant doit être <strong className="text-foreground">immédiatement signalé</strong>.
                    Tout colis retiré sans signalement sera considéré comme intègre.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="magasinage">
                <AccordionTrigger className="text-left">Magasinage</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
                  <p>Le propriétaire dispose d'un <strong className="text-foreground">délai de 10 jours</strong> pour récupérer son colis.</p>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-sm">
                      <span>Après 10 jours (aérien)</span>
                      <span className="font-semibold text-foreground">1 000 F/kg/jour</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-sm">
                      <span>Après 10 jours (maritime)</span>
                      <span className="font-semibold text-foreground">1 000 F/m³/jour</span>
                    </div>
                  </div>
                  <p className="text-sm">Après <strong className="text-foreground">2 mois</strong>, nous déclinons toute responsabilité. Après <strong className="text-foreground">6 mois</strong>, la marchandise peut être considérée comme abandonnée et vendue.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reevaluation">
                <AccordionTrigger className="text-left">Réévaluation des frais de transport</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
                  <h4 className="font-semibold text-foreground">Colis aérien</h4>
                  <p>
                    Lors de l'expédition, votre colis est regroupé avec d'autres dans de grands cartons (consolidation).
                    Le poids généralement facturé est le poids net, mais le poids à l'aéroport est le poids volumétrique.
                    Cette différence est supportée par notre compagnie, sauf si elle est élevée (max +0.5 kg).
                  </p>
                  <p>
                    Lors d'une réévaluation, le poids facturé prendra en compte le poids ET le volume.
                    La douane facturée sera le montant du Guichet Unique pour le Commerce Extérieur.
                  </p>
                  <h4 className="font-semibold text-foreground mt-4">Colis maritime</h4>
                  <p>
                    La réévaluation se fait en votre présence et d'un responsable. Vous pourrez prendre les mesures
                    de votre colis et la valeur trouvée sera celle considérée pour la nouvelle facturation.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="remboursement">
                <AccordionTrigger className="text-left">Remboursement (pertes ou dommages)</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Lorsqu'un colis confirmé est endommagé ou perdu, la <strong className="text-foreground">valeur déclarée</strong> est
                    celle entièrement remboursée.
                  </p>
                  <p>
                    Si la valeur n'a pas été déclarée, le client sera invité à soumettre la facture d'achat et sera
                    remboursé de la <strong className="text-foreground">moitié de la valeur</strong> figurant sur la facture.
                  </p>
                  <p className="text-sm italic">
                    L'emballage est de la responsabilité du fournisseur. Un dommage dû à un mauvais emballage ne nous est pas imputable.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="force-majeure">
                <AccordionTrigger className="text-left">Causes de force majeure</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Nous ne sommes en aucun cas responsable des pertes, dommages ou retards causés par :</p>
                  <ul className="space-y-1 ml-2">
                    {[
                      "Catastrophes naturelles",
                      "Guerres, accidents, embargos, émeutes ou révoltes civiles",
                      "Défauts ou vices intrinsèques de la marchandise",
                      "Actes ou omissions de l'expéditeur, du destinataire ou de toute autorité compétente",
                      "Grèves, lock-out ou conflits de travail",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="livraisons-locales">
                <AccordionTrigger className="text-left">Livraisons locales</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Lorsqu'un colis arrive à destination, le propriétaire peut demander une livraison s'il est dans
                  l'incapacité de se déplacer. Il peut envoyer un représentant ou un coursier effectuer les formalités à sa place.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <Link to="/tracking" className="text-primary hover:underline">← Retour au suivi</Link>
          {" · "}
          <Link to="/process" className="text-primary hover:underline">Processus & délais</Link>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
