/* eslint-disable eqeqeq */
/* eslint-disable dot-notation */
// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

import { BigDecimal } from './shims/BigDecimal'

function Lohnsteuer2026(params) {

    /* Input variables */

    /**
     * 1, wenn die Anwendung des Faktorverfahrens gewählt wurden (nur in Steuerklasse IV)
     */
    this.af = 1;
    if (params["af"] !== undefined) {
        this.setAf(params["af"]);
    }

    /**
     * Auf die Vollendung des 64. Lebensjahres folgende
     * Kalenderjahr (erforderlich, wenn ALTER1=1)
     */
    this.AJAHR = 0;
    if (params["AJAHR"] !== undefined) {
        this.setAjahr(params["AJAHR"]);
    }

    /**
     * 1, wenn das 64. Lebensjahr zu Beginn des Kalenderjahres vollendet wurde, in dem
     * der Lohnzahlungszeitraum endet (§ 24 a EStG), sonst = 0
     */
    this.ALTER1 = 0;
    if (params["ALTER1"] !== undefined) {
        this.setAlter1(params["ALTER1"]);
    }

    /**
     * Merker für die Vorsorgepauschale
     * 0 = der Arbeitnehmer ist in der Arbeitslosenversicherung pflichtversichert; es gilt die allgemeine Beitragsbemessungsgrenze
     * 1 = wenn nicht 0
     */
    this.ALV = 0;
    if (params["ALV"] !== undefined) {
        this.setAlv(params["ALV"]);
    }

    /**
     * eingetragener Faktor mit drei Nachkommastellen
     */
    this.f = 1.0;
    if (params["f"] !== undefined) {
        this.setF(params["f"]);
    }

    /**
     * Jahresfreibetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge
     * sowie für Vermögensbeteiligungen nach § 19a Absatz 1 und 4 EStG nach Maßgabe der
     * elektronischen Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung
     * auf der Bescheinigung für den Lohnsteuerabzug 2026 in Cent (ggf. 0)
     */
    this.JFREIB = BigDecimal.ZERO();
    if (params["JFREIB"] !== undefined) {
        this.setJfreib(params["JFREIB"]);
    }

    /**
     * Jahreshinzurechnungsbetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge
     * sowie für Vermögensbeteiligungen nach § 19a Absatz 1 und 4 EStG nach Maßgabe der
     * elektronischen Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung auf der
     * Bescheinigung für den Lohnsteuerabzug 2026 in Cent (ggf. 0)
     */
    this.JHINZU = BigDecimal.ZERO();
    if (params["JHINZU"] !== undefined) {
        this.setJhinzu(params["JHINZU"]);
    }

    /**
     * Voraussichtlicher Jahresarbeitslohn ohne sonstige Bezüge (d.h. auch ohne
     * die zu besteuernden Vorteile bei Vermögensbeteiligungen,
     * § 19a Absatz 4 EStG) in Cent.
     * Anmerkung: Die Eingabe dieses Feldes (ggf. 0) ist erforderlich bei Eingaben zu sonstigen
     * Bezügen (Feld SONSTB).
     * Sind in einem vorangegangenen Abrechnungszeitraum bereits sonstige Bezüge gezahlt worden,
     * so sind sie dem voraussichtlichen Jahresarbeitslohn hinzuzurechnen. Gleiches gilt für zu
     * besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 EStG).
     */
    this.JRE4 = BigDecimal.ZERO();
    if (params["JRE4"] !== undefined) {
        this.setJre4(params["JRE4"]);
    }

    /**
     * In JRE4 enthaltene Entschädigungen nach § 24 Nummer 1 EStG und zu besteuernde
     * Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 EStG) in Cent
     */
    this.JRE4ENT = BigDecimal.ZERO();
    if (params["JRE4ENT"] !== undefined) {
        this.setJre4ent(params["JRE4ENT"]);
    }

    /**
     * In JRE4 enthaltene Versorgungsbezüge in Cent (ggf. 0)
     */
    this.JVBEZ = BigDecimal.ZERO();
    if (params["JVBEZ"] !== undefined) {
        this.setJvbez(params["JVBEZ"]);
    }

    /**
     * Merker für die Vorsorgepauschale
     * 0 = der Arbeitnehmer ist in der gesetzlichen Rentenversicherung oder einer
     * berufsständischen Versorgungseinrichtung pflichtversichert oder bei Befreiung von der
     * Versicherungspflicht freiwillig versichert; es gilt die allgemeine Beitragsbemessungsgrenze
     *
     * 1 = wenn nicht 0
     *
     */
    this.KRV = 0;
    if (params["KRV"] !== undefined) {
        this.setKrv(params["KRV"]);
    }

    /**
     * Kassenindividueller Zusatzbeitragssatz bei einem gesetzlich krankenversicherten Arbeitnehmer
     * in Prozent (bspw. 2,50 für 2,50 %) mit 2 Dezimalstellen.
     * Es ist der volle Zusatzbeitragssatz anzugeben. Die Aufteilung in Arbeitnehmer- und Arbeitgeber-
     * anteil erfolgt im Programmablauf.
     */
    this.KVZ = BigDecimal.ZERO();
    if (params["KVZ"] !== undefined) {
        this.setKvz(params["KVZ"]);
    }

    /**
     * Lohnzahlungszeitraum:
     * 1 = Jahr
     * 2 = Monat
     * 3 = Woche
     * 4 = Tag
     */
    this.LZZ = 1;
    if (params["LZZ"] !== undefined) {
        this.setLzz(params["LZZ"]);
    }

    /**
     * Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte
     * oder in der Bescheinigung für den Lohnsteuerabzug 2026 eingetragene Freibetrag für den
     * Lohnzahlungszeitraum in Cent
     */
    this.LZZFREIB = BigDecimal.ZERO();
    if (params["LZZFREIB"] !== undefined) {
        this.setLzzfreib(params["LZZFREIB"]);
    }

    /**
     * Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte
     * oder in der Bescheinigung für den Lohnsteuerabzug 2026 eingetragene Hinzurechnungsbetrag für den
     * Lohnzahlungszeitraum in Cent
     */
    this.LZZHINZU = BigDecimal.ZERO();
    if (params["LZZHINZU"] !== undefined) {
        this.setLzzhinzu(params["LZZHINZU"]);
    }

    /**
     * Nicht zu besteuernde Vorteile bei Vermögensbeteiligungen
     * (§ 19a Absatz 1 Satz 4 EStG) in Cent
     */
    this.MBV = BigDecimal.ZERO();
    if (params["MBV"] !== undefined) {
        this.setMbv(params["MBV"]);
    }

    /**
     * Dem Arbeitgeber mitgeteilte Beiträge des Arbeitnehmers für eine private
     * Basiskranken- bzw. Pflege-Pflichtversicherung im Sinne des
     * § 10 Absatz 1 Nummer 3 EStG in Cent; der Wert ist unabhängig vom Lohnzahlungszeitraum
     * immer als Monatsbetrag anzugeben
     */
    this.PKPV = BigDecimal.ZERO();
    if (params["PKPV"] !== undefined) {
        this.setPkpv(params["PKPV"]);
    }

    /**
     * Arbeitgeberzuschuss für eine private Basiskranken- bzw. Pflege-Pflichtversicherung im
     * Sinne des § 10 Absatz 1 Nummer 3 EStG in Cent; der Wert ist unabhängig vom
     * Lohnzahlungszeitraum immer als Monatsbetrag anzugeben
     */
    this.PKPVAGZ = BigDecimal.ZERO();
    if (params["PKPVAGZ"] !== undefined) {
        this.setPkpvagz(params["PKPVAGZ"]);
    }

    /**
     * Krankenversicherung:
     * 0 = gesetzlich krankenversicherte Arbeitnehmer
     * 1 = ausschließlich privat krankenversicherte Arbeitnehmer
     */
    this.PKV = 0;
    if (params["PKV"] !== undefined) {
        this.setPkv(params["PKV"]);
    }

    /**
     * Zahl der beim Arbeitnehmer zu berücksichtigenden Beitragsabschläge in der sozialen Pflegeversicherung
     * bei mehr als einem Kind
     * 0 = kein Abschlag
     * 1 = Beitragsabschlag für das 2. Kind
     * 2 = Beitragsabschläge für das 2. und 3. Kind
     * 3 = Beitragsabschläge für 2. bis 4. Kinder
     * 4 = Beitragsabschläge für 2. bis 5. oder mehr Kinder
     */
    this.PVA = BigDecimal.ZERO();
    if (params["PVA"] !== undefined) {
        this.setPva(params["PVA"]);
    }

    /**
     * 1, wenn bei der sozialen Pflegeversicherung die Besonderheiten in Sachsen zu berücksichtigen sind bzw.
     * zu berücksichtigen wären
     */
    this.PVS = 0;
    if (params["PVS"] !== undefined) {
        this.setPvs(params["PVS"]);
    }

    /**
     * 1, wenn er der Arbeitnehmer den Zuschlag zur sozialen Pflegeversicherung
     * zu zahlen hat
     */
    this.PVZ = 0;
    if (params["PVZ"] !== undefined) {
        this.setPvz(params["PVZ"]);
    }

    /**
     * Religionsgemeinschaft des Arbeitnehmers lt. elektronischer Lohnsteuerabzugsmerkmale oder der
     * Bescheinigung für den Lohnsteuerabzug 2026 (bei keiner Religionszugehörigkeit = 0)
     */
    this.R = 0;
    if (params["R"] !== undefined) {
        this.setR(params["R"]);
    }

    /**
     * Steuerpflichtiger Arbeitslohn für den Lohnzahlungszeitraum vor Berücksichtigung des
     * Versorgungsfreibetrags und des Zuschlags zum Versorgungsfreibetrag, des Altersentlastungsbetrags
     * und des als elektronisches Lohnsteuerabzugsmerkmal festgestellten oder in der Bescheinigung für
     * den Lohnsteuerabzug 2026 für den Lohnzahlungszeitraum eingetragenen Freibetrags bzw.
     * Hinzurechnungsbetrags in Cent
     */
    this.RE4 = BigDecimal.ZERO();
    if (params["RE4"] !== undefined) {
        this.setRe4(params["RE4"]);
    }

    /**
     * Sonstige Bezüge einschließlich zu besteuernde Vorteile bei Vermögensbeteiligungen und Sterbegeld bei Versorgungsbezügen sowie
     * Kapitalauszahlungen/Abfindungen, in Cent (ggf. 0)
     */
    this.SONSTB = BigDecimal.ZERO();
    if (params["SONSTB"] !== undefined) {
        this.setSonstb(params["SONSTB"]);
    }

    /**
     * In SONSTB enthaltene Entschädigungen nach § 24 Nummer 1 EStG sowie zu besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a
     * Absatz 4 EStG), in Cent
     */
    this.SONSTENT = BigDecimal.ZERO();
    if (params["SONSTENT"] !== undefined) {
        this.setSonstent(params["SONSTENT"]);
    }

    /**
     * Sterbegeld bei Versorgungsbezügen sowie Kapitalauszahlungen/Abfindungen
     * (in SONSTB enthalten), in Cent
     */
    this.STERBE = BigDecimal.ZERO();
    if (params["STERBE"] !== undefined) {
        this.setSterbe(params["STERBE"]);
    }

    /**
     * Steuerklasse:
     * 1 = I
     * 2 = II
     * 3 = III
     * 4 = IV
     * 5 = V
     * 6 = VI
     */
    this.STKL = 1;
    if (params["STKL"] !== undefined) {
        this.setStkl(params["STKL"]);
    }

    /**
     * In RE4 enthaltene Versorgungsbezüge in Cent (ggf. 0) ggf. unter Berücksichtigung
     * einer geänderten Bemessungsgrundlage nach  § 19 Absatz 2 Satz 10 und 11 EStG
     */
    this.VBEZ = BigDecimal.ZERO();
    if (params["VBEZ"] !== undefined) {
        this.setVbez(params["VBEZ"]);
    }

    /**
     * Versorgungsbezug im Januar 2005 bzw. für den ersten vollen Monat, wenn der
     * Versorgungsbezug erstmalig nach Januar 2005 gewährt  wurde, in Cent
     */
    this.VBEZM = BigDecimal.ZERO();
    if (params["VBEZM"] !== undefined) {
        this.setVbezm(params["VBEZM"]);
    }

    /**
     * Voraussichtliche Sonderzahlungen von Versorgungsbezügen im
     * Kalenderjahr des Versorgungsbeginns bei Versorgungsempfängern
     * ohne Sterbegeld, Kapitalauszahlungen/Abfindungen in Cent
     *
     */
    this.VBEZS = BigDecimal.ZERO();
    if (params["VBEZS"] !== undefined) {
        this.setVbezs(params["VBEZS"]);
    }

    /**
     * In SONSTB enthaltene Versorgungsbezüge einschließlich Sterbegeld in Cent (ggf. 0)
     */
    this.VBS = BigDecimal.ZERO();
    if (params["VBS"] !== undefined) {
        this.setVbs(params["VBS"]);
    }

    /**
     * Jahr, in dem der Versorgungsbezug erstmalig gewährt wurde;
     * werden mehrere Versorgungsbezüge gezahlt, wird aus
     * Vereinfachungsgründen für die Berechnung das Jahr des ältesten
     * erstmaligen Bezugs herangezogen; auf die Möglichkeit der
     * getrennten Abrechnung verschiedenartiger Bezüge (§ 39e Absatz 5a
     * EStG) wird im Übrigen verwiesen
     */
    this.VJAHR = 0;
    if (params["VJAHR"] !== undefined) {
        this.setVjahr(params["VJAHR"]);
    }

    /**
     * Zahl der Freibeträge für Kinder (eine Dezimalstelle, nur bei Steuerklassen
     * I, II, III und IV)
     */
    this.ZKF = BigDecimal.ZERO();
    if (params["ZKF"] !== undefined) {
        this.setZkf(params["ZKF"]);
    }

    /**
     * Zahl der Monate, für die Versorgungsbezüge gezahlt werden [nur
     * erforderlich bei Jahresberechnung (LZZ = 1)]
     */
    this.ZMVB = 0;
    if (params["ZMVB"] !== undefined) {
        this.setZmvb(params["ZMVB"]);
    }

    /* Output variables */

    /**
     * Bemessungsgrundlage für die Kirchenlohnsteuer in Cent
     */
    this.BK = BigDecimal.ZERO();

    /**
     * Bemessungsgrundlage der sonstigen Bezüge  für die Kirchenlohnsteuer in Cent.
     * Hinweis: Negativbeträge, die aus nicht zu besteuernden Vorteilen bei
     * Vermögensbeteiligungen (§ 19a Absatz 1 Satz 4 EStG) resultieren, mindern BK
     * (maximal bis 0). Der Sonderausgabenabzug für tatsächlich erbrachte Vorsorgeaufwendungen
     * im Rahmen der Veranlagung zur Einkommensteuer bleibt unberührt.
     */
    this.BKS = BigDecimal.ZERO();

    /**
     * Für den Lohnzahlungszeitraum einzubehaltende Lohnsteuer in Cent
     */
    this.LSTLZZ = BigDecimal.ZERO();

    /**
     * Für den Lohnzahlungszeitraum einzubehaltender Solidaritätszuschlag
     * in Cent
     */
    this.SOLZLZZ = BigDecimal.ZERO();

    /**
     * Solidaritätszuschlag für sonstige Bezüge in Cent.
     * Hinweis: Negativbeträge, die aus nicht zu besteuernden Vorteilen bei
     * Vermögensbeteiligungen (§ 19a Absatz 1 Satz 4 EStG) resultieren,
     * mindern SOLZLZZ (maximal bis 0). Der Sonderausgabenabzug für
     * tatsächlich erbrachte Vorsorgeaufwendungen im Rahmen der
     * Veranlagung zur Einkommensteuer bleibt unberührt.
     */
    this.SOLZS = BigDecimal.ZERO();

    /**
     * Lohnsteuer für sonstige Bezüge in Cent
     * Hinweis: Negativbeträge, die aus nicht zu besteuernden Vorteilen bei Vermögensbeteiligungen
     * (§ 19a Absatz 1 Satz 4 EStG) resultieren, mindern LSTLZZ (maximal bis 0). Der
     * Sonderausgabenabzug für tatsächlich erbrachte Vorsorgeaufwendungen im Rahmen der
     * Veranlagung zur Einkommensteuer bleibt unberührt.
     */
    this.STS = BigDecimal.ZERO();

    /**
     * Verbrauchter Freibetrag bei Berechnung des laufenden Arbeitslohns, in Cent
     */
    this.VFRB = BigDecimal.ZERO();

    /**
     * Verbrauchter Freibetrag bei Berechnung des voraussichtlichen Jahresarbeitslohns, in Cent
     */
    this.VFRBS1 = BigDecimal.ZERO();

    /**
     * Verbrauchter Freibetrag bei Berechnung der sonstigen Bezüge, in Cent
     */
    this.VFRBS2 = BigDecimal.ZERO();

    /**
     * Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE über
     * dem Grundfreibetrag bei der Berechnung des laufenden Arbeitslohns, in Cent
     */
    this.WVFRB = BigDecimal.ZERO();

    /**
     * Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE über dem Grundfreibetrag
     * bei der Berechnung des voraussichtlichen Jahresarbeitslohns, in Cent
     */
    this.WVFRBO = BigDecimal.ZERO();

    /**
     * Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE
     * über dem Grundfreibetrag bei der Berechnung der sonstigen Bezüge, in Cent
     */
    this.WVFRBM = BigDecimal.ZERO();

    /* Internal variables */

    /**
     * Altersentlastungsbetrag in Euro, Cent (2 Dezimalstellen)
     */
    this.ALTE = BigDecimal.ZERO();

    /**
     * Arbeitnehmer-Pauschbetrag/Werbungskosten-Pauschbetrag in Euro
     */
    this.ANP = BigDecimal.ZERO();

    /**
     * Auf den Lohnzahlungszeitraum entfallender Anteil von Jahreswerten
     * auf ganze Cent abgerundet
     */
    this.ANTEIL1 = BigDecimal.ZERO();

    /**
     * Beitragssatz des Arbeitnehmers zur Arbeitslosenversicherung (4 Dezimalstellen)
     */
    this.AVSATZAN = BigDecimal.ZERO();

    /**
     * Beitragsbemessungsgrenze in der gesetzlichen Krankenversicherung
     * und der sozialen Pflegeversicherung in Euro
     */
    this.BBGKVPV = BigDecimal.ZERO();

    /**
     * Allgemeine Beitragsbemessungsgrenze in der allgemeinen Rentenversicherung und Arbeitslosenversicherung in Euro
     */
    this.BBGRVALV = BigDecimal.ZERO();

    /**
     * Bemessungsgrundlage für Altersentlastungsbetrag in Euro, Cent
     * (2 Dezimalstellen)
     */
    this.BMG = BigDecimal.ZERO();

    /**
     * Differenz zwischen ST1 und ST2 in Euro
     */
    this.DIFF = BigDecimal.ZERO();

    /**
     * Entlastungsbetrag für Alleinerziehende in Euro
     */
    this.EFA = BigDecimal.ZERO();

    /**
     * Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen)
     */
    this.FVB = BigDecimal.ZERO();

    /**
     * Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen) für die Berechnung
     * der Lohnsteuer beim sonstigen Bezug
     */
    this.FVBSO = BigDecimal.ZERO();

    /**
     * Zuschlag zum Versorgungsfreibetrag in Euro
     */
    this.FVBZ = BigDecimal.ZERO();

    /**
     * Zuschlag zum Versorgungsfreibetrag in Euro für die Berechnung
     * der Lohnsteuer beim sonstigen Bezug
     */
    this.FVBZSO = BigDecimal.ZERO();

    /**
     * Grundfreibetrag in Euro
     */
    this.GFB = BigDecimal.ZERO();

    /**
     * Maximaler Altersentlastungsbetrag in Euro
     */
    this.HBALTE = BigDecimal.ZERO();

    /**
     * Maßgeblicher maximaler Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen)
     */
    this.HFVB = BigDecimal.ZERO();

    /**
     * Maßgeblicher maximaler Zuschlag zum Versorgungsfreibetrag in Euro, Cent
     * (2 Dezimalstellen)
     */
    this.HFVBZ = BigDecimal.ZERO();

    /**
     * Maßgeblicher maximaler Zuschlag zum Versorgungsfreibetrag in Euro, Cent (2 Dezimalstellen)
     * für die Berechnung der Lohnsteuer für den sonstigen Bezug
     */
    this.HFVBZSO = BigDecimal.ZERO();

    /**
     * Zwischenfeld zu X für die Berechnung der Steuer nach § 39b
     * Absatz 2 Satz 7 EStG in Euro
     */
    this.HOCH = BigDecimal.ZERO();

    /**
     * Nummer der Tabellenwerte für Versorgungsparameter
     */
    this.J = 0;

    /**
     * Jahressteuer nach § 51a EStG, aus der Solidaritätszuschlag und
     * Bemessungsgrundlage für die Kirchenlohnsteuer ermittelt werden in Euro
     */
    this.JBMG = BigDecimal.ZERO();

    /**
     * Auf einen Jahreslohn hochgerechneter LZZFREIB in Euro, Cent
     * (2 Dezimalstellen)
     */
    this.JLFREIB = BigDecimal.ZERO();

    /**
     * Auf einen Jahreslohn hochgerechnete LZZHINZU in Euro, Cent
     * (2 Dezimalstellen)
     */
    this.JLHINZU = BigDecimal.ZERO();

    /**
     * Jahreswert, dessen Anteil für einen Lohnzahlungszeitraum in
     * UPANTEIL errechnet werden soll in Cent
     */
    this.JW = BigDecimal.ZERO();

    /**
     * Nummer der Tabellenwerte für Parameter bei Altersentlastungsbetrag
     */
    this.K = 0;

    /**
     * Summe der Freibeträge für Kinder in Euro
     */
    this.KFB = BigDecimal.ZERO();

    /**
     * Beitragssatz des Arbeitnehmers zur Krankenversicherung
     * (5 Dezimalstellen)
     */
    this.KVSATZAN = BigDecimal.ZERO();

    /**
     * Kennzahl für die Einkommensteuer-Tabellenart:
     * 1 = Grundtarif
     * 2 = Splittingverfahren
     */
    this.KZTAB = 0;

    /**
     * Jahreslohnsteuer in Euro
     */
    this.LSTJAHR = BigDecimal.ZERO();

    /**
     * Zwischenfelder der Jahreslohnsteuer in Cent
     */
    this.LSTOSO = BigDecimal.ZERO();
    this.LSTSO = BigDecimal.ZERO();

    /**
     * Mindeststeuer für die Steuerklassen V und VI in Euro
     */
    this.MIST = BigDecimal.ZERO();

    /**
     * Auf einen Jahreswert hochgerechneter Arbeitgeberzuschuss für eine private Basiskranken-
     * bzw. Pflege-Pflichtversicherung im Sinne des § 10 Absatz 1 Nummer 3 EStG in Euro, Cent (2 Dezimalstellen)
     */
    this.PKPVAGZJ = BigDecimal.ZERO();

    /**
     * Beitragssatz des Arbeitnehmers zur Pflegeversicherung (6 Dezimalstellen)
     */
    this.PVSATZAN = BigDecimal.ZERO();

    /**
     * Beitragssatz des Arbeitnehmers in der allgemeinen gesetzlichen Rentenversicherung (4 Dezimalstellen)
     */
    this.RVSATZAN = BigDecimal.ZERO();

    /**
     * Rechenwert in Gleitkommadarstellung
     */
    this.RW = BigDecimal.ZERO();

    /**
     * Sonderausgaben-Pauschbetrag in Euro
     */
    this.SAP = BigDecimal.ZERO();

    /**
     * Freigrenze für den Solidaritätszuschlag in Euro
     */
    this.SOLZFREI = BigDecimal.ZERO();

    /**
     * Solidaritätszuschlag auf die Jahreslohnsteuer in Euro, Cent (2 Dezimalstellen)
     */
    this.SOLZJ = BigDecimal.ZERO();

    /**
     * Zwischenwert für den Solidaritätszuschlag auf die Jahreslohnsteuer
     * in Euro, Cent (2 Dezimalstellen)
     */
    this.SOLZMIN = BigDecimal.ZERO();

    /**
     * Bemessungsgrundlage des Solidaritätszuschlags zur Prüfung der Freigrenze beim Solidaritätszuschlag für sonstige Bezüge in Euro
     */
    this.SOLZSBMG = BigDecimal.ZERO();

    /**
     * Zu versteuerndes Einkommen für die Ermittlung der
     * Bemessungsgrundlage des Solidaritätszuschlags zur Prüfung der
     * Freigrenze beim Solidaritätszuschlag für sonstige Bezüge in Euro,
     * Cent (2 Dezimalstellen)
     */
    this.SOLZSZVE = BigDecimal.ZERO();

    /**
     * Tarifliche Einkommensteuer in Euro
     */
    this.ST = BigDecimal.ZERO();

    /**
     * Tarifliche Einkommensteuer auf das 1,25-fache ZX in Euro
     */
    this.ST1 = BigDecimal.ZERO();

    /**
     * Tarifliche Einkommensteuer auf das 0,75-fache ZX in Euro
     */
    this.ST2 = BigDecimal.ZERO();

    /**
     * Bemessungsgrundlage für den Versorgungsfreibetrag in Cent
     */
    this.VBEZB = BigDecimal.ZERO();

    /**
     * Bemessungsgrundlage für den Versorgungsfreibetrag in Cent für
     * den sonstigen Bezug
     */
    this.VBEZBSO = BigDecimal.ZERO();

    /**
     * Zwischenfeld zu X für die Berechnung der Steuer nach § 39b
     * Absatz 2 Satz 7 EStG in Euro
     */
    this.VERGL = BigDecimal.ZERO();

    /**
     * Auf den Höchstbetrag begrenzte Beiträge zur Arbeitslosenversicherung
     * einschließlich Kranken- und Pflegeversicherung in Euro, Cent (2 Dezimalstellen)
     */
    this.VSPHB = BigDecimal.ZERO();

    /**
     * Vorsorgepauschale mit Teilbeträgen für die Rentenversicherung
     * sowie die gesetzliche Kranken- und soziale Pflegeversicherung nach
     * fiktiven Beträgen oder ggf. für die private Basiskrankenversicherung
     * und private Pflege-Pflichtversicherung in Euro, Cent (2 Dezimalstellen)
     */
    this.VSP = BigDecimal.ZERO();

    /**
     * Vorsorgepauschale mit Teilbeträgen für die Rentenversicherung sowie auf den Höchstbetrag
     * begrenzten Teilbeträgen für die Arbeitslosen-, Kranken- und Pflegeversicherung in
     * Euro, Cent (2 Dezimalstellen)
     */
    this.VSPN = BigDecimal.ZERO();

    /**
     * Teilbetrag für die Arbeitslosenversicherung bei der Berechnung der
     * Vorsorgepauschale in Euro, Cent (2 Dezimalstellen)
     */
    this.VSPALV = BigDecimal.ZERO();

    /**
     * Vorsorgepauschale mit Teilbeträgen für die gesetzliche Kranken- und soziale Pflegeversicherung
     * nach fiktiven Beträgen oder ggf. für die private Basiskrankenversicherung und private
     * Pflege-Pflichtversicherung in Euro, Cent (2 Dezimalstellen)
     */
    this.VSPKVPV = BigDecimal.ZERO();

    /**
     * Teilbetrag für die Rentenversicherung bei der Berechnung der Vorsorgepauschale
     * in Euro, Cent (2 Dezimalstellen)
     */
    this.VSPR = BigDecimal.ZERO();

    /**
     * Erster Grenzwert in Steuerklasse V/VI in Euro
     */
    this.W1STKL5 = BigDecimal.ZERO();

    /**
     * Zweiter Grenzwert in Steuerklasse V/VI in Euro
     */
    this.W2STKL5 = BigDecimal.ZERO();

    /**
     * Dritter Grenzwert in Steuerklasse V/VI in Euro
     */
    this.W3STKL5 = BigDecimal.ZERO();

    /**
     * Zu versteuerndes Einkommen gem. § 32a Absatz 1 und 5 EStG in Euro, Cent
     * (2 Dezimalstellen)
     */
    this.X = BigDecimal.ZERO();

    /**
     * Gem. § 32a Absatz 1 EStG (6 Dezimalstellen)
     */
    this.Y = BigDecimal.ZERO();

    /**
     * Auf einen Jahreslohn hochgerechnetes RE4 in Euro, Cent (2 Dezimalstellen)
     * nach Abzug der Freibeträge nach § 39 b Absatz 2 Satz 3 und 4 EStG
     */
    this.ZRE4 = BigDecimal.ZERO();

    /**
     * Auf einen Jahreslohn hochgerechnetes RE4 in Euro, Cent (2 Dezimalstellen)
     */
    this.ZRE4J = BigDecimal.ZERO();

    /**
     * Auf einen Jahreslohn hochgerechnetes RE4, ggf. nach Abzug der
     * Entschädigungen i.S.d. § 24 Nummer 1 EStG in Euro, Cent
     * (2 Dezimalstellen)
     */
    this.ZRE4VP = BigDecimal.ZERO();

    /**
     * Zwischenfeld zu ZRE4VP für die Begrenzung auf die jeweilige
     * Beitragsbemessungsgrenze in Euro, Cent (2 Dezimalstellen)"
     */
    this.ZRE4VPR = BigDecimal.ZERO();

    /**
     * Feste Tabellenfreibeträge (ohne Vorsorgepauschale) in Euro, Cent
     * (2 Dezimalstellen)
     */
    this.ZTABFB = BigDecimal.ZERO();

    /**
     * Auf einen Jahreslohn hochgerechnetes VBEZ abzüglich FVB in
     * Euro, Cent (2 Dezimalstellen)
     */
    this.ZVBEZ = BigDecimal.ZERO();

    /**
     * Auf einen Jahreslohn hochgerechnetes VBEZ in Euro, Cent (2 Dezimalstellen)
     */
    this.ZVBEZJ = BigDecimal.ZERO();

    /**
     * Zu versteuerndes Einkommen in Euro, Cent (2 Dezimalstellen)
     */
    this.ZVE = BigDecimal.ZERO();

    /**
     * Zwischenfeld zu X für die Berechnung der Steuer nach § 39b
     * Absatz 2 Satz 7 EStG in Euro
     */
    this.ZX = BigDecimal.ZERO();

    /**
     * Zwischenfeld zu X für die Berechnung der Steuer nach § 39b
     * Absatz 2 Satz 7 EStG in Euro
     */
    this.ZZX = BigDecimal.ZERO();
}

/* Constants */

/**
 * Tabelle für die Prozentsätze des Versorgungsfreibetrags
 */
Object.defineProperty(Lohnsteuer2026, 'TAB1', {value: [BigDecimal.ZERO(), BigDecimal.valueOf(0.4), BigDecimal.valueOf(0.384), BigDecimal.valueOf(0.368), BigDecimal.valueOf(0.352), BigDecimal.valueOf(0.336), BigDecimal.valueOf(0.32), BigDecimal.valueOf(0.304), BigDecimal.valueOf(0.288), BigDecimal.valueOf(0.272), BigDecimal.valueOf(0.256), BigDecimal.valueOf(0.24), BigDecimal.valueOf(0.224), BigDecimal.valueOf(0.208), BigDecimal.valueOf(0.192), BigDecimal.valueOf(0.176), BigDecimal.valueOf(0.16), BigDecimal.valueOf(0.152), BigDecimal.valueOf(0.144), BigDecimal.valueOf(0.14), BigDecimal.valueOf(0.136), BigDecimal.valueOf(0.132), BigDecimal.valueOf(0.128), BigDecimal.valueOf(0.124), BigDecimal.valueOf(0.12), BigDecimal.valueOf(0.116), BigDecimal.valueOf(0.112), BigDecimal.valueOf(0.108), BigDecimal.valueOf(0.104), BigDecimal.valueOf(0.1), BigDecimal.valueOf(0.096), BigDecimal.valueOf(0.092), BigDecimal.valueOf(0.088), BigDecimal.valueOf(0.084), BigDecimal.valueOf(0.08), BigDecimal.valueOf(0.076), BigDecimal.valueOf(0.072), BigDecimal.valueOf(0.068), BigDecimal.valueOf(0.064), BigDecimal.valueOf(0.06), BigDecimal.valueOf(0.056), BigDecimal.valueOf(0.052), BigDecimal.valueOf(0.048), BigDecimal.valueOf(0.044), BigDecimal.valueOf(0.04), BigDecimal.valueOf(0.036), BigDecimal.valueOf(0.032), BigDecimal.valueOf(0.028), BigDecimal.valueOf(0.024), BigDecimal.valueOf(0.02), BigDecimal.valueOf(0.016), BigDecimal.valueOf(0.012), BigDecimal.valueOf(0.008), BigDecimal.valueOf(0.004), BigDecimal.valueOf(0)]});

/**
 * Tabelle für die Höchstbeträge des Versorgungsfreibetrags
 */
Object.defineProperty(Lohnsteuer2026, 'TAB2', {value: [BigDecimal.ZERO(), BigDecimal.valueOf(3000), BigDecimal.valueOf(2880), BigDecimal.valueOf(2760), BigDecimal.valueOf(2640), BigDecimal.valueOf(2520), BigDecimal.valueOf(2400), BigDecimal.valueOf(2280), BigDecimal.valueOf(2160), BigDecimal.valueOf(2040), BigDecimal.valueOf(1920), BigDecimal.valueOf(1800), BigDecimal.valueOf(1680), BigDecimal.valueOf(1560), BigDecimal.valueOf(1440), BigDecimal.valueOf(1320), BigDecimal.valueOf(1200), BigDecimal.valueOf(1140), BigDecimal.valueOf(1080), BigDecimal.valueOf(1050), BigDecimal.valueOf(1020), BigDecimal.valueOf(990), BigDecimal.valueOf(960), BigDecimal.valueOf(930), BigDecimal.valueOf(900), BigDecimal.valueOf(870), BigDecimal.valueOf(840), BigDecimal.valueOf(810), BigDecimal.valueOf(780), BigDecimal.valueOf(750), BigDecimal.valueOf(720), BigDecimal.valueOf(690), BigDecimal.valueOf(660), BigDecimal.valueOf(630), BigDecimal.valueOf(600), BigDecimal.valueOf(570), BigDecimal.valueOf(540), BigDecimal.valueOf(510), BigDecimal.valueOf(480), BigDecimal.valueOf(450), BigDecimal.valueOf(420), BigDecimal.valueOf(390), BigDecimal.valueOf(360), BigDecimal.valueOf(330), BigDecimal.valueOf(300), BigDecimal.valueOf(270), BigDecimal.valueOf(240), BigDecimal.valueOf(210), BigDecimal.valueOf(180), BigDecimal.valueOf(150), BigDecimal.valueOf(120), BigDecimal.valueOf(90), BigDecimal.valueOf(60), BigDecimal.valueOf(30), BigDecimal.valueOf(0)]});

/**
 * Tabelle für die Zuschläge zum Versorgungsfreibetrag
 */
Object.defineProperty(Lohnsteuer2026, 'TAB3', {value: [BigDecimal.ZERO(), BigDecimal.valueOf(900), BigDecimal.valueOf(864), BigDecimal.valueOf(828), BigDecimal.valueOf(792), BigDecimal.valueOf(756), BigDecimal.valueOf(720), BigDecimal.valueOf(684), BigDecimal.valueOf(648), BigDecimal.valueOf(612), BigDecimal.valueOf(576), BigDecimal.valueOf(540), BigDecimal.valueOf(504), BigDecimal.valueOf(468), BigDecimal.valueOf(432), BigDecimal.valueOf(396), BigDecimal.valueOf(360), BigDecimal.valueOf(342), BigDecimal.valueOf(324), BigDecimal.valueOf(315), BigDecimal.valueOf(306), BigDecimal.valueOf(297), BigDecimal.valueOf(288), BigDecimal.valueOf(279), BigDecimal.valueOf(270), BigDecimal.valueOf(261), BigDecimal.valueOf(252), BigDecimal.valueOf(243), BigDecimal.valueOf(234), BigDecimal.valueOf(225), BigDecimal.valueOf(216), BigDecimal.valueOf(207), BigDecimal.valueOf(198), BigDecimal.valueOf(189), BigDecimal.valueOf(180), BigDecimal.valueOf(171), BigDecimal.valueOf(162), BigDecimal.valueOf(153), BigDecimal.valueOf(144), BigDecimal.valueOf(135), BigDecimal.valueOf(126), BigDecimal.valueOf(117), BigDecimal.valueOf(108), BigDecimal.valueOf(99), BigDecimal.valueOf(90), BigDecimal.valueOf(81), BigDecimal.valueOf(72), BigDecimal.valueOf(63), BigDecimal.valueOf(54), BigDecimal.valueOf(45), BigDecimal.valueOf(36), BigDecimal.valueOf(27), BigDecimal.valueOf(18), BigDecimal.valueOf(9), BigDecimal.valueOf(0)]});

/**
 * Tabelle für die Höchstbeträge des Altersentlastungsbetrags
 */
Object.defineProperty(Lohnsteuer2026, 'TAB4', {value: [BigDecimal.ZERO(), BigDecimal.valueOf(0.4), BigDecimal.valueOf(0.384), BigDecimal.valueOf(0.368), BigDecimal.valueOf(0.352), BigDecimal.valueOf(0.336), BigDecimal.valueOf(0.32), BigDecimal.valueOf(0.304), BigDecimal.valueOf(0.288), BigDecimal.valueOf(0.272), BigDecimal.valueOf(0.256), BigDecimal.valueOf(0.24), BigDecimal.valueOf(0.224), BigDecimal.valueOf(0.208), BigDecimal.valueOf(0.192), BigDecimal.valueOf(0.176), BigDecimal.valueOf(0.16), BigDecimal.valueOf(0.152), BigDecimal.valueOf(0.144), BigDecimal.valueOf(0.14), BigDecimal.valueOf(0.136), BigDecimal.valueOf(0.132), BigDecimal.valueOf(0.128), BigDecimal.valueOf(0.124), BigDecimal.valueOf(0.12), BigDecimal.valueOf(0.116), BigDecimal.valueOf(0.112), BigDecimal.valueOf(0.108), BigDecimal.valueOf(0.104), BigDecimal.valueOf(0.1), BigDecimal.valueOf(0.096), BigDecimal.valueOf(0.092), BigDecimal.valueOf(0.088), BigDecimal.valueOf(0.084), BigDecimal.valueOf(0.08), BigDecimal.valueOf(0.076), BigDecimal.valueOf(0.072), BigDecimal.valueOf(0.068), BigDecimal.valueOf(0.064), BigDecimal.valueOf(0.06), BigDecimal.valueOf(0.056), BigDecimal.valueOf(0.052), BigDecimal.valueOf(0.048), BigDecimal.valueOf(0.044), BigDecimal.valueOf(0.04), BigDecimal.valueOf(0.036), BigDecimal.valueOf(0.032), BigDecimal.valueOf(0.028), BigDecimal.valueOf(0.024), BigDecimal.valueOf(0.02), BigDecimal.valueOf(0.016), BigDecimal.valueOf(0.012), BigDecimal.valueOf(0.008), BigDecimal.valueOf(0.004), BigDecimal.valueOf(0)]});

/**
 * Tabelle fuer die Hächstbeträge des Altersentlastungsbetrags
 */
Object.defineProperty(Lohnsteuer2026, 'TAB5', {value: [BigDecimal.ZERO(), BigDecimal.valueOf(1900), BigDecimal.valueOf(1824), BigDecimal.valueOf(1748), BigDecimal.valueOf(1672), BigDecimal.valueOf(1596), BigDecimal.valueOf(1520), BigDecimal.valueOf(1444), BigDecimal.valueOf(1368), BigDecimal.valueOf(1292), BigDecimal.valueOf(1216), BigDecimal.valueOf(1140), BigDecimal.valueOf(1064), BigDecimal.valueOf(988), BigDecimal.valueOf(912), BigDecimal.valueOf(836), BigDecimal.valueOf(760), BigDecimal.valueOf(722), BigDecimal.valueOf(684), BigDecimal.valueOf(665), BigDecimal.valueOf(646), BigDecimal.valueOf(627), BigDecimal.valueOf(608), BigDecimal.valueOf(589), BigDecimal.valueOf(570), BigDecimal.valueOf(551), BigDecimal.valueOf(532), BigDecimal.valueOf(513), BigDecimal.valueOf(494), BigDecimal.valueOf(475), BigDecimal.valueOf(456), BigDecimal.valueOf(437), BigDecimal.valueOf(418), BigDecimal.valueOf(399), BigDecimal.valueOf(380), BigDecimal.valueOf(361), BigDecimal.valueOf(342), BigDecimal.valueOf(323), BigDecimal.valueOf(304), BigDecimal.valueOf(285), BigDecimal.valueOf(266), BigDecimal.valueOf(247), BigDecimal.valueOf(228), BigDecimal.valueOf(209), BigDecimal.valueOf(190), BigDecimal.valueOf(171), BigDecimal.valueOf(152), BigDecimal.valueOf(133), BigDecimal.valueOf(114), BigDecimal.valueOf(95), BigDecimal.valueOf(76), BigDecimal.valueOf(57), BigDecimal.valueOf(38), BigDecimal.valueOf(19), BigDecimal.valueOf(0)]});

/**
 * Zahlenkonstanten fuer im Plan oft genutzte BigDecimal Werte
 */
Object.defineProperty(Lohnsteuer2026, 'ZAHL1', {value: BigDecimal.ONE()});
Object.defineProperty(Lohnsteuer2026, 'ZAHL2', {value: BigDecimal.valueOf(2)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL5', {value: BigDecimal.valueOf(5)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL7', {value: BigDecimal.valueOf(7)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL12', {value: BigDecimal.valueOf(12)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL100', {value: BigDecimal.valueOf(100)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL360', {value: BigDecimal.valueOf(360)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL500', {value: BigDecimal.valueOf(500)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL700', {value: BigDecimal.valueOf(700)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL1000', {value: BigDecimal.valueOf(1000)});
Object.defineProperty(Lohnsteuer2026, 'ZAHL10000', {value: BigDecimal.valueOf(10000)});

Lohnsteuer2026.prototype.setAf = function(value) {
    this.af = value;
}

Lohnsteuer2026.prototype.setAjahr = function(value) {
    this.AJAHR = value;
}

Lohnsteuer2026.prototype.setAlter1 = function(value) {
    this.ALTER1 = value;
}

Lohnsteuer2026.prototype.setAlv = function(value) {
    this.ALV = value;
}

Lohnsteuer2026.prototype.setF = function(value) {
    this.f = value;
}

Lohnsteuer2026.prototype.setJfreib = function(value) {
    this.JFREIB = value;
}

Lohnsteuer2026.prototype.setJhinzu = function(value) {
    this.JHINZU = value;
}

Lohnsteuer2026.prototype.setJre4 = function(value) {
    this.JRE4 = value;
}

Lohnsteuer2026.prototype.setJre4ent = function(value) {
    this.JRE4ENT = value;
}

Lohnsteuer2026.prototype.setJvbez = function(value) {
    this.JVBEZ = value;
}

Lohnsteuer2026.prototype.setKrv = function(value) {
    this.KRV = value;
}

Lohnsteuer2026.prototype.setKvz = function(value) {
    this.KVZ = value;
}

Lohnsteuer2026.prototype.setLzz = function(value) {
    this.LZZ = value;
}

Lohnsteuer2026.prototype.setLzzfreib = function(value) {
    this.LZZFREIB = value;
}

Lohnsteuer2026.prototype.setLzzhinzu = function(value) {
    this.LZZHINZU = value;
}

Lohnsteuer2026.prototype.setMbv = function(value) {
    this.MBV = value;
}

Lohnsteuer2026.prototype.setPkpv = function(value) {
    this.PKPV = value;
}

Lohnsteuer2026.prototype.setPkpvagz = function(value) {
    this.PKPVAGZ = value;
}

Lohnsteuer2026.prototype.setPkv = function(value) {
    this.PKV = value;
}

Lohnsteuer2026.prototype.setPva = function(value) {
    this.PVA = value;
}

Lohnsteuer2026.prototype.setPvs = function(value) {
    this.PVS = value;
}

Lohnsteuer2026.prototype.setPvz = function(value) {
    this.PVZ = value;
}

Lohnsteuer2026.prototype.setR = function(value) {
    this.R = value;
}

Lohnsteuer2026.prototype.setRe4 = function(value) {
    this.RE4 = value;
}

Lohnsteuer2026.prototype.setSonstb = function(value) {
    this.SONSTB = value;
}

Lohnsteuer2026.prototype.setSonstent = function(value) {
    this.SONSTENT = value;
}

Lohnsteuer2026.prototype.setSterbe = function(value) {
    this.STERBE = value;
}

Lohnsteuer2026.prototype.setStkl = function(value) {
    this.STKL = value;
}

Lohnsteuer2026.prototype.setVbez = function(value) {
    this.VBEZ = value;
}

Lohnsteuer2026.prototype.setVbezm = function(value) {
    this.VBEZM = value;
}

Lohnsteuer2026.prototype.setVbezs = function(value) {
    this.VBEZS = value;
}

Lohnsteuer2026.prototype.setVbs = function(value) {
    this.VBS = value;
}

Lohnsteuer2026.prototype.setVjahr = function(value) {
    this.VJAHR = value;
}

Lohnsteuer2026.prototype.setZkf = function(value) {
    this.ZKF = value;
}

Lohnsteuer2026.prototype.setZmvb = function(value) {
    this.ZMVB = value;
}

Lohnsteuer2026.prototype.getBk = function() {
    return this.BK;
}

Lohnsteuer2026.prototype.getBks = function() {
    return this.BKS;
}

Lohnsteuer2026.prototype.getLstlzz = function() {
    return this.LSTLZZ;
}

Lohnsteuer2026.prototype.getSolzlzz = function() {
    return this.SOLZLZZ;
}

Lohnsteuer2026.prototype.getSolzs = function() {
    return this.SOLZS;
}

Lohnsteuer2026.prototype.getSts = function() {
    return this.STS;
}

Lohnsteuer2026.prototype.getVfrb = function() {
    return this.VFRB;
}

Lohnsteuer2026.prototype.getVfrbs1 = function() {
    return this.VFRBS1;
}

Lohnsteuer2026.prototype.getVfrbs2 = function() {
    return this.VFRBS2;
}

Lohnsteuer2026.prototype.getWvfrb = function() {
    return this.WVFRB;
}

Lohnsteuer2026.prototype.getWvfrbo = function() {
    return this.WVFRBO;
}

Lohnsteuer2026.prototype.getWvfrbm = function() {
    return this.WVFRBM;
}

/**
 * PROGRAMMABLAUFPLAN 2026
 * Steueruung, PAP Seite 13
 */
Lohnsteuer2026.prototype.MAIN = function() {
    this.MPARA();
    this.MRE4JL();
    this.VBEZBSO = BigDecimal.ZERO();
    this.MRE4();
    this.MRE4ABZ();
    this.MBERECH();
    this.MSONST();
}

/**
 * Zuweisung von Werten für bestimmte Steuer- und Sozialversicherungsparameter  PAP Seite 14
 */
Lohnsteuer2026.prototype.MPARA = function() {
    this.BBGRVALV = BigDecimal.valueOf(101400);
    this.AVSATZAN = BigDecimal.valueOf(0.013);
    this.RVSATZAN = BigDecimal.valueOf(0.093);
    this.BBGKVPV = BigDecimal.valueOf(69750);
    this.KVSATZAN = this.KVZ.divide(Lohnsteuer2026.ZAHL2).divide(Lohnsteuer2026.ZAHL100).add(BigDecimal.valueOf(0.07));
    if (this.PVS == 1) {
        this.PVSATZAN = BigDecimal.valueOf(0.023);
    } else {
        this.PVSATZAN = BigDecimal.valueOf(0.018);
    }
    if (this.PVZ == 1) {
        this.PVSATZAN = this.PVSATZAN.add(BigDecimal.valueOf(0.006));
    } else {
        this.PVSATZAN = this.PVSATZAN.subtract(this.PVA.multiply(BigDecimal.valueOf(0.0025)));
    }
    this.W1STKL5 = BigDecimal.valueOf(14071);
    this.W2STKL5 = BigDecimal.valueOf(34939);
    this.W3STKL5 = BigDecimal.valueOf(222260);
    this.GFB = BigDecimal.valueOf(12348);
    this.SOLZFREI = BigDecimal.valueOf(20350);
}

/**
 * Ermittlung des Jahresarbeitslohns nach § 39 b Absatz 2 Satz 2 EStG, PAP Seite 15
 */
Lohnsteuer2026.prototype.MRE4JL = function() {
    if (this.LZZ == 1) {
        this.ZRE4J = this.RE4.divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
        this.ZVBEZJ = this.VBEZ.divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
        this.JLFREIB = this.LZZFREIB.divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
        this.JLHINZU = this.LZZHINZU.divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
    } else {
        if (this.LZZ == 2) {
            this.ZRE4J = this.RE4.multiply(Lohnsteuer2026.ZAHL12).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
            this.ZVBEZJ = this.VBEZ.multiply(Lohnsteuer2026.ZAHL12).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
            this.JLFREIB = this.LZZFREIB.multiply(Lohnsteuer2026.ZAHL12).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
            this.JLHINZU = this.LZZHINZU.multiply(Lohnsteuer2026.ZAHL12).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
        } else {
            if (this.LZZ == 3) {
                this.ZRE4J = this.RE4.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL700, 2, BigDecimal.ROUND_DOWN);
                this.ZVBEZJ = this.VBEZ.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL700, 2, BigDecimal.ROUND_DOWN);
                this.JLFREIB = this.LZZFREIB.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL700, 2, BigDecimal.ROUND_DOWN);
                this.JLHINZU = this.LZZHINZU.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL700, 2, BigDecimal.ROUND_DOWN);
            } else {
                this.ZRE4J = this.RE4.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
                this.ZVBEZJ = this.VBEZ.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
                this.JLFREIB = this.LZZFREIB.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
                this.JLHINZU = this.LZZHINZU.multiply(Lohnsteuer2026.ZAHL360).divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
            }
        }
    }
    if (this.af == 0) {
        this.f = 1;
    }
}

/**
 * Freibeträge für Versorgungsbezüge, Altersentlastungsbetrag (§ 39b Absatz 2 Satz 3 EStG), PAP Seite 16
 */
Lohnsteuer2026.prototype.MRE4 = function() {
    if (this.ZVBEZJ.compareTo(BigDecimal.ZERO()) == 0) {
        this.FVBZ = BigDecimal.ZERO();
        this.FVB = BigDecimal.ZERO();
        this.FVBZSO = BigDecimal.ZERO();
        this.FVBSO = BigDecimal.ZERO();
    } else {
        if (this.VJAHR < 2006) {
            this.J = 1;
        } else {
            if (this.VJAHR < 2058) {
                this.J = this.VJAHR - 2004;
            } else {
                this.J = 54;
            }
        }
        if (this.LZZ == 1) {
            this.VBEZB = this.VBEZM.multiply(BigDecimal.valueOf(this.ZMVB)).add(this.VBEZS);
            this.HFVB = Lohnsteuer2026.TAB2[this.J].divide(Lohnsteuer2026.ZAHL12).multiply(BigDecimal.valueOf(this.ZMVB)).setScale(0, BigDecimal.ROUND_UP);
            this.FVBZ = Lohnsteuer2026.TAB3[this.J].divide(Lohnsteuer2026.ZAHL12).multiply(BigDecimal.valueOf(this.ZMVB)).setScale(0, BigDecimal.ROUND_UP);
        } else {
            this.VBEZB = this.VBEZM.multiply(Lohnsteuer2026.ZAHL12).add(this.VBEZS).setScale(2, BigDecimal.ROUND_DOWN);
            this.HFVB = Lohnsteuer2026.TAB2[this.J];
            this.FVBZ = Lohnsteuer2026.TAB3[this.J];
        }
        this.FVB = this.VBEZB.multiply(Lohnsteuer2026.TAB1[this.J]).divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_UP);
        if (this.FVB.compareTo(this.HFVB) == 1) {
            this.FVB = this.HFVB;
        }
        if (this.FVB.compareTo(this.ZVBEZJ) == 1) {
            this.FVB = this.ZVBEZJ;
        }
        this.FVBSO = this.FVB.add(this.VBEZBSO.multiply(Lohnsteuer2026.TAB1[this.J]).divide(Lohnsteuer2026.ZAHL100)).setScale(2, BigDecimal.ROUND_UP);
        if (this.FVBSO.compareTo(Lohnsteuer2026.TAB2[this.J]) == 1) {
            this.FVBSO = Lohnsteuer2026.TAB2[this.J];
        }
        this.HFVBZSO = this.VBEZB.add(this.VBEZBSO).divide(Lohnsteuer2026.ZAHL100).subtract(this.FVBSO).setScale(2, BigDecimal.ROUND_DOWN);
        this.FVBZSO = this.FVBZ.add(this.VBEZBSO.divide(Lohnsteuer2026.ZAHL100)).setScale(0, BigDecimal.ROUND_UP);
        if (this.FVBZSO.compareTo(this.HFVBZSO) == 1) {
            this.FVBZSO = this.HFVBZSO.setScale(0, BigDecimal.ROUND_UP);
        }
        if (this.FVBZSO.compareTo(Lohnsteuer2026.TAB3[this.J]) == 1) {
            this.FVBZSO = Lohnsteuer2026.TAB3[this.J];
        }
        this.HFVBZ = this.VBEZB.divide(Lohnsteuer2026.ZAHL100).subtract(this.FVB).setScale(2, BigDecimal.ROUND_DOWN);
        if (this.FVBZ.compareTo(this.HFVBZ) == 1) {
            this.FVBZ = this.HFVBZ.setScale(0, BigDecimal.ROUND_UP);
        }
    }
    this.MRE4ALTE();
}

/**
 * Altersentlastungsbetrag (§ 39b Absatz 2 Satz 3 EStG), PAP Seite 17
 */
Lohnsteuer2026.prototype.MRE4ALTE = function() {
    if (this.ALTER1 == 0) {
        this.ALTE = BigDecimal.ZERO();
    } else {
        if (this.AJAHR < 2006) {
            this.K = 1;
        } else {
            if (this.AJAHR < 2058) {
                this.K = this.AJAHR - 2004;
            } else {
                this.K = 54;
            }
        }
        this.BMG = this.ZRE4J.subtract(this.ZVBEZJ);
        this.ALTE = this.BMG.multiply(Lohnsteuer2026.TAB4[this.K]).setScale(0, BigDecimal.ROUND_UP);
        this.HBALTE = Lohnsteuer2026.TAB5[this.K];
        if (this.ALTE.compareTo(this.HBALTE) == 1) {
            this.ALTE = this.HBALTE;
        }
    }
}

/**
 * Ermittlung des Jahresarbeitslohns nach Abzug der Freibeträge nach § 39 b Absatz 2 Satz 3 und 4 EStG, PAP Seite 20
 */
Lohnsteuer2026.prototype.MRE4ABZ = function() {
    this.ZRE4 = this.ZRE4J.subtract(this.FVB).subtract(this.ALTE).subtract(this.JLFREIB).add(this.JLHINZU).setScale(2, BigDecimal.ROUND_DOWN);
    if (this.ZRE4.compareTo(BigDecimal.ZERO()) == -1) {
        this.ZRE4 = BigDecimal.ZERO();
    }
    this.ZRE4VP = this.ZRE4J;
    this.ZVBEZ = this.ZVBEZJ.subtract(this.FVB).setScale(2, BigDecimal.ROUND_DOWN);
    if (this.ZVBEZ.compareTo(BigDecimal.ZERO()) == -1) {
        this.ZVBEZ = BigDecimal.ZERO();
    }
}

/**
 * Berechnung fuer laufende Lohnzahlungszeitraueme Seite 21
 */
Lohnsteuer2026.prototype.MBERECH = function() {
    this.MZTABFB();
    this.VFRB = this.ANP.add(this.FVB.add(this.FVBZ)).multiply(Lohnsteuer2026.ZAHL100).setScale(0, BigDecimal.ROUND_DOWN);
    this.MLSTJAHR();
    this.WVFRB = this.ZVE.subtract(this.GFB).multiply(Lohnsteuer2026.ZAHL100).setScale(0, BigDecimal.ROUND_DOWN);
    if (this.WVFRB.compareTo(BigDecimal.ZERO()) == -1) {
        this.WVFRB = BigDecimal.ZERO();
    }
    this.LSTJAHR = this.ST.multiply(BigDecimal.valueOf(this.f)).setScale(0, BigDecimal.ROUND_DOWN);
    this.UPLSTLZZ();
    if (this.ZKF.compareTo(BigDecimal.ZERO()) == 1) {
        this.ZTABFB = this.ZTABFB.add(this.KFB);
        this.MRE4ABZ();
        this.MLSTJAHR();
        this.JBMG = this.ST.multiply(BigDecimal.valueOf(this.f)).setScale(0, BigDecimal.ROUND_DOWN);
    } else {
        this.JBMG = this.LSTJAHR;
    }
    this.MSOLZ();
}

/**
 * Ermittlung der festen Tabellenfreibeträge (ohne Vorsorgepauschale), PAP Seite 22
 */
Lohnsteuer2026.prototype.MZTABFB = function() {
    this.ANP = BigDecimal.ZERO();
    if (this.ZVBEZ.compareTo(BigDecimal.ZERO()) >= 0 && this.ZVBEZ.compareTo(this.FVBZ) == -1) {
        this.FVBZ = BigDecimal.valueOf(this.ZVBEZ.longValue());
    }
    if (this.STKL < 6) {
        if (this.ZVBEZ.compareTo(BigDecimal.ZERO()) == 1) {
            if (this.ZVBEZ.subtract(this.FVBZ).compareTo(BigDecimal.valueOf(102)) == -1) {
                this.ANP = this.ZVBEZ.subtract(this.FVBZ).setScale(0, BigDecimal.ROUND_UP);
            } else {
                this.ANP = BigDecimal.valueOf(102);
            }
        }
    } else {
        this.FVBZ = BigDecimal.ZERO();
        this.FVBZSO = BigDecimal.ZERO();
    }
    if (this.STKL < 6) {
        if (this.ZRE4.compareTo(this.ZVBEZ) == 1) {
            if (this.ZRE4.subtract(this.ZVBEZ).compareTo(BigDecimal.valueOf(1230)) == -1) {
                this.ANP = this.ANP.add(this.ZRE4).subtract(this.ZVBEZ).setScale(0, BigDecimal.ROUND_UP);
            } else {
                this.ANP = this.ANP.add(BigDecimal.valueOf(1230));
            }
        }
    }
    this.KZTAB = 1;
    if (this.STKL == 1) {
        this.SAP = BigDecimal.valueOf(36);
        this.KFB = this.ZKF.multiply(BigDecimal.valueOf(9756)).setScale(0, BigDecimal.ROUND_DOWN);
    } else {
        if (this.STKL == 2) {
            this.EFA = BigDecimal.valueOf(4260);
            this.SAP = BigDecimal.valueOf(36);
            this.KFB = this.ZKF.multiply(BigDecimal.valueOf(9756)).setScale(0, BigDecimal.ROUND_DOWN);
        } else {
            if (this.STKL == 3) {
                this.KZTAB = 2;
                this.SAP = BigDecimal.valueOf(36);
                this.KFB = this.ZKF.multiply(BigDecimal.valueOf(9756)).setScale(0, BigDecimal.ROUND_DOWN);
            } else {
                if (this.STKL == 4) {
                    this.SAP = BigDecimal.valueOf(36);
                    this.KFB = this.ZKF.multiply(BigDecimal.valueOf(4878)).setScale(0, BigDecimal.ROUND_DOWN);
                } else {
                    if (this.STKL == 5) {
                        this.SAP = BigDecimal.valueOf(36);
                        this.KFB = BigDecimal.ZERO();
                    } else {
                        this.KFB = BigDecimal.ZERO();
                    }
                }
            }
        }
    }
    this.ZTABFB = this.EFA.add(this.ANP).add(this.SAP).add(this.FVBZ).setScale(2, BigDecimal.ROUND_DOWN);
}

/**
 * Ermittlung Jahreslohnsteuer, PAP Seite 23
 */
Lohnsteuer2026.prototype.MLSTJAHR = function() {
    this.UPEVP();
    this.ZVE = this.ZRE4.subtract(this.ZTABFB).subtract(this.VSP);
    this.UPMLST();
}

/**
 * PAP Seite 24
 */
Lohnsteuer2026.prototype.UPLSTLZZ = function() {
    this.JW = this.LSTJAHR.multiply(Lohnsteuer2026.ZAHL100);
    this.UPANTEIL();
    this.LSTLZZ = this.ANTEIL1;
}

/**
 * PAP Seite 25
 */
Lohnsteuer2026.prototype.UPMLST = function() {
    if (this.ZVE.compareTo(Lohnsteuer2026.ZAHL1) == -1) {
        this.ZVE = BigDecimal.ZERO();
        this.X = BigDecimal.ZERO();
    } else {
        this.X = this.ZVE.divide(BigDecimal.valueOf(this.KZTAB)).setScale(0, BigDecimal.ROUND_DOWN);
    }
    if (this.STKL < 5) {
        this.UPTAB26();
    } else {
        this.MST5_6();
    }
}

/**
 * Vorsorgepauschale (§ 39b Absatz 2 Satz 5 Nummer 3 EStG) PAP Seite 26
 */
Lohnsteuer2026.prototype.UPEVP = function() {
    if (this.KRV == 1) {
        this.VSPR = BigDecimal.ZERO();
    } else {
        if (this.ZRE4VP.compareTo(this.BBGRVALV) == 1) {
            this.ZRE4VPR = this.BBGRVALV;
        } else {
            this.ZRE4VPR = this.ZRE4VP;
        }
        this.VSPR = this.ZRE4VPR.multiply(this.RVSATZAN).setScale(2, BigDecimal.ROUND_DOWN);
    }
    this.MVSPKVPV();
    // eslint-disable-next-line no-empty
    if (this.ALV == 1) {
    } else {
        // eslint-disable-next-line no-empty
        if (this.STKL == 6) {
        } else {
            this.MVSPHB();
        }
    }
}

/**
 * Vorsorgepauschale (§ 39b Absatz 2 Satz 5 Nummer 3 Buchstaben b bis d EStG), PAP Seite 27
 */
Lohnsteuer2026.prototype.MVSPKVPV = function() {
    if (this.ZRE4VP.compareTo(this.BBGKVPV) == 1) {
        this.ZRE4VPR = this.BBGKVPV;
    } else {
        this.ZRE4VPR = this.ZRE4VP;
    }
    if (this.PKV > 0) {
        if (this.STKL == 6) {
            this.VSPKVPV = BigDecimal.ZERO();
        } else {
            this.PKPVAGZJ = this.PKPVAGZ.multiply(Lohnsteuer2026.ZAHL12).divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
            this.VSPKVPV = this.PKPV.multiply(Lohnsteuer2026.ZAHL12).divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
            this.VSPKVPV = this.VSPKVPV.subtract(this.PKPVAGZJ);
            if (this.VSPKVPV.compareTo(BigDecimal.ZERO()) == -1) {
                this.VSPKVPV = BigDecimal.ZERO();
            }
        }
    } else {
        this.VSPKVPV = this.ZRE4VPR.multiply(this.KVSATZAN.add(this.PVSATZAN)).setScale(2, BigDecimal.ROUND_DOWN);
    }
    this.VSP = this.VSPKVPV.add(this.VSPR).setScale(0, BigDecimal.ROUND_UP);
}

/**
 * Höchstbetragsberechnung zur Arbeitslosenversicherung (§ 39b Absatz 2 Satz 5 Nummer 3 Buchstabe e EStG), PAP Seite 28
 */
Lohnsteuer2026.prototype.MVSPHB = function() {
    if (this.ZRE4VP.compareTo(this.BBGRVALV) == 1) {
        this.ZRE4VPR = this.BBGRVALV;
    } else {
        this.ZRE4VPR = this.ZRE4VP;
    }
    this.VSPALV = this.AVSATZAN.multiply(this.ZRE4VPR).setScale(2, BigDecimal.ROUND_DOWN);
    this.VSPHB = this.VSPALV.add(this.VSPKVPV).setScale(2, BigDecimal.ROUND_DOWN);
    if (this.VSPHB.compareTo(BigDecimal.valueOf(1900)) == 1) {
        this.VSPHB = BigDecimal.valueOf(1900);
    }
    this.VSPN = this.VSPR.add(this.VSPHB).setScale(0, BigDecimal.ROUND_UP);
    if (this.VSPN.compareTo(this.VSP) == 1) {
        this.VSP = this.VSPN;
    }
}

/**
 * Lohnsteuer fuer die Steuerklassen V und VI (§ 39b Absatz 2 Satz 7 EStG), PAP Seite 29
 */
Lohnsteuer2026.prototype.MST5_6 = function() {
    this.ZZX = this.X;
    if (this.ZZX.compareTo(this.W2STKL5) == 1) {
        this.ZX = this.W2STKL5;
        this.UP5_6();
        if (this.ZZX.compareTo(this.W3STKL5) == 1) {
            this.ST = this.ST.add(this.W3STKL5.subtract(this.W2STKL5).multiply(BigDecimal.valueOf(0.42))).setScale(0, BigDecimal.ROUND_DOWN);
            this.ST = this.ST.add(this.ZZX.subtract(this.W3STKL5).multiply(BigDecimal.valueOf(0.45))).setScale(0, BigDecimal.ROUND_DOWN);
        } else {
            this.ST = this.ST.add(this.ZZX.subtract(this.W2STKL5).multiply(BigDecimal.valueOf(0.42))).setScale(0, BigDecimal.ROUND_DOWN);
        }
    } else {
        this.ZX = this.ZZX;
        this.UP5_6();
        if (this.ZZX.compareTo(this.W1STKL5) == 1) {
            this.VERGL = this.ST;
            this.ZX = this.W1STKL5;
            this.UP5_6();
            this.HOCH = this.ST.add(this.ZZX.subtract(this.W1STKL5).multiply(BigDecimal.valueOf(0.42))).setScale(0, BigDecimal.ROUND_DOWN);
            if (this.HOCH.compareTo(this.VERGL) == -1) {
                this.ST = this.HOCH;
            } else {
                this.ST = this.VERGL;
            }
        }
    }
}

/**
 * Unterprogramm zur Lohnsteuer fuer die Steuerklassen V und VI (§ 39b Absatz 2 Satz 7 EStG), PAP Seite 30
 */
Lohnsteuer2026.prototype.UP5_6 = function() {
    this.X = this.ZX.multiply(BigDecimal.valueOf(1.25)).setScale(0, BigDecimal.ROUND_DOWN);
    this.UPTAB26();
    this.ST1 = this.ST;
    this.X = this.ZX.multiply(BigDecimal.valueOf(0.75)).setScale(0, BigDecimal.ROUND_DOWN);
    this.UPTAB26();
    this.ST2 = this.ST;
    this.DIFF = this.ST1.subtract(this.ST2).multiply(Lohnsteuer2026.ZAHL2);
    this.MIST = this.ZX.multiply(BigDecimal.valueOf(0.14)).setScale(0, BigDecimal.ROUND_DOWN);
    if (this.MIST.compareTo(this.DIFF) == 1) {
        this.ST = this.MIST;
    } else {
        this.ST = this.DIFF;
    }
}

/**
 * Solidaritätszuschlag, PAP Seite 31
 */
Lohnsteuer2026.prototype.MSOLZ = function() {
    this.SOLZFREI = this.SOLZFREI.multiply(BigDecimal.valueOf(this.KZTAB));
    if (this.JBMG.compareTo(this.SOLZFREI) == 1) {
        this.SOLZJ = this.JBMG.multiply(BigDecimal.valueOf(5.5)).divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
        this.SOLZMIN = this.JBMG.subtract(this.SOLZFREI).multiply(BigDecimal.valueOf(11.9)).divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
        if (this.SOLZMIN.compareTo(this.SOLZJ) == -1) {
            this.SOLZJ = this.SOLZMIN;
        }
        this.JW = this.SOLZJ.multiply(Lohnsteuer2026.ZAHL100).setScale(0, BigDecimal.ROUND_DOWN);
        this.UPANTEIL();
        this.SOLZLZZ = this.ANTEIL1;
    } else {
        this.SOLZLZZ = BigDecimal.ZERO();
    }
    if (this.R > 0) {
        this.JW = this.JBMG.multiply(Lohnsteuer2026.ZAHL100);
        this.UPANTEIL();
        this.BK = this.ANTEIL1;
    } else {
        this.BK = BigDecimal.ZERO();
    }
}

/**
 * Anteil von Jahresbeträgen fuer einen LZZ (§ 39b Absatz 2 Satz 9 EStG), PAP Seite 32
 */
Lohnsteuer2026.prototype.UPANTEIL = function() {
    if (this.LZZ == 1) {
        this.ANTEIL1 = this.JW;
    } else {
        if (this.LZZ == 2) {
            this.ANTEIL1 = this.JW.divide(Lohnsteuer2026.ZAHL12, 0, BigDecimal.ROUND_DOWN);
        } else {
            if (this.LZZ == 3) {
                this.ANTEIL1 = this.JW.multiply(Lohnsteuer2026.ZAHL7).divide(Lohnsteuer2026.ZAHL360, 0, BigDecimal.ROUND_DOWN);
            } else {
                this.ANTEIL1 = this.JW.divide(Lohnsteuer2026.ZAHL360, 0, BigDecimal.ROUND_DOWN);
            }
        }
    }
}

/**
 * Berechnung sonstiger Bezüge nach § 39b Absatz 3 Sätze 1 bis 8 EStG, PAP Seite 33
 */
Lohnsteuer2026.prototype.MSONST = function() {
    this.LZZ = 1;
    if (this.ZMVB == 0) {
        this.ZMVB = 12;
    }
    if (this.SONSTB.compareTo(BigDecimal.ZERO()) == 0 && this.MBV.compareTo(BigDecimal.ZERO()) == 0) {
        this.LSTSO = BigDecimal.ZERO();
        this.STS = BigDecimal.ZERO();
        this.SOLZS = BigDecimal.ZERO();
        this.BKS = BigDecimal.ZERO();
    } else {
        this.MOSONST();
        this.ZRE4J = this.JRE4.add(this.SONSTB).divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
        this.ZVBEZJ = this.JVBEZ.add(this.VBS).divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
        this.VBEZBSO = this.STERBE;
        this.MRE4SONST();
        this.MLSTJAHR();
        this.WVFRBM = this.ZVE.subtract(this.GFB).multiply(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
        if (this.WVFRBM.compareTo(BigDecimal.ZERO()) == -1) {
            this.WVFRBM = BigDecimal.ZERO();
        }
        this.LSTSO = this.ST.multiply(Lohnsteuer2026.ZAHL100);
        this.STS = this.LSTSO.subtract(this.LSTOSO).multiply(BigDecimal.valueOf(this.f)).divide(Lohnsteuer2026.ZAHL100, 0, BigDecimal.ROUND_DOWN).multiply(Lohnsteuer2026.ZAHL100);
        this.STSMIN();
    }
}

/**
 * PAP Seite 34
 */
Lohnsteuer2026.prototype.STSMIN = function() {
    if (this.STS.compareTo(BigDecimal.ZERO()) == -1) {
        // eslint-disable-next-line no-empty
        if (this.MBV.compareTo(BigDecimal.ZERO()) == 0) {
        } else {
            this.LSTLZZ = this.LSTLZZ.add(this.STS);
            if (this.LSTLZZ.compareTo(BigDecimal.ZERO()) == -1) {
                this.LSTLZZ = BigDecimal.ZERO();
            }
            this.SOLZLZZ = this.SOLZLZZ.add(this.STS.multiply(BigDecimal.valueOf(5.5).divide(Lohnsteuer2026.ZAHL100))).setScale(0, BigDecimal.ROUND_DOWN);
            if (this.SOLZLZZ.compareTo(BigDecimal.ZERO()) == -1) {
                this.SOLZLZZ = BigDecimal.ZERO();
            }
            this.BK = this.BK.add(this.STS);
            if (this.BK.compareTo(BigDecimal.ZERO()) == -1) {
                this.BK = BigDecimal.ZERO();
            }
        }
        this.STS = BigDecimal.ZERO();
        this.SOLZS = BigDecimal.ZERO();
    } else {
        this.MSOLZSTS();
    }
    if (this.R > 0) {
        this.BKS = this.STS;
    } else {
        this.BKS = BigDecimal.ZERO();
    }
}

/**
 * Berechnung des SolZ auf sonstige Bezüge, PAP Seite 35
 */
Lohnsteuer2026.prototype.MSOLZSTS = function() {
    if (this.ZKF.compareTo(BigDecimal.ZERO()) == 1) {
        this.SOLZSZVE = this.ZVE.subtract(this.KFB);
    } else {
        this.SOLZSZVE = this.ZVE;
    }
    if (this.SOLZSZVE.compareTo(BigDecimal.ONE()) == -1) {
        this.SOLZSZVE = BigDecimal.ZERO();
        this.X = BigDecimal.ZERO();
    } else {
        this.X = this.SOLZSZVE.divide(BigDecimal.valueOf(this.KZTAB), 0, BigDecimal.ROUND_DOWN);
    }
    if (this.STKL < 5) {
        this.UPTAB26();
    } else {
        this.MST5_6();
    }
    this.SOLZSBMG = this.ST.multiply(BigDecimal.valueOf(this.f)).setScale(0, BigDecimal.ROUND_DOWN);
    if (this.SOLZSBMG.compareTo(this.SOLZFREI) == 1) {
        this.SOLZS = this.STS.multiply(BigDecimal.valueOf(5.5)).divide(Lohnsteuer2026.ZAHL100, 0, BigDecimal.ROUND_DOWN);
    } else {
        this.SOLZS = BigDecimal.ZERO();
    }
}

/**
 * Sonderberechnung ohne sonstige Bezüge für Berechnung bei sonstigen Bezügen, PAP Seite 36
 */
Lohnsteuer2026.prototype.MOSONST = function() {
    this.ZRE4J = this.JRE4.divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
    this.ZVBEZJ = this.JVBEZ.divide(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
    this.JLFREIB = this.JFREIB.divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
    this.JLHINZU = this.JHINZU.divide(Lohnsteuer2026.ZAHL100, 2, BigDecimal.ROUND_DOWN);
    this.MRE4();
    this.MRE4ABZ();
    this.ZRE4VP = this.ZRE4VP.subtract(this.JRE4ENT.divide(Lohnsteuer2026.ZAHL100));
    this.MZTABFB();
    this.VFRBS1 = this.ANP.add(this.FVB.add(this.FVBZ)).multiply(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
    this.MLSTJAHR();
    this.WVFRBO = this.ZVE.subtract(this.GFB).multiply(Lohnsteuer2026.ZAHL100).setScale(2, BigDecimal.ROUND_DOWN);
    if (this.WVFRBO.compareTo(BigDecimal.ZERO()) == -1) {
        this.WVFRBO = BigDecimal.ZERO();
    }
    this.LSTOSO = this.ST.multiply(Lohnsteuer2026.ZAHL100);
}

/**
 * Sonderberechnung mit sonstigen Bezüge für Berechnung bei sonstigen Bezügen, PAP Seite 37
 */
Lohnsteuer2026.prototype.MRE4SONST = function() {
    this.MRE4();
    this.FVB = this.FVBSO;
    this.MRE4ABZ();
    this.ZRE4VP = this.ZRE4VP.add(this.MBV.divide(Lohnsteuer2026.ZAHL100)).subtract(this.JRE4ENT.divide(Lohnsteuer2026.ZAHL100)).subtract(this.SONSTENT.divide(Lohnsteuer2026.ZAHL100));
    this.FVBZ = this.FVBZSO;
    this.MZTABFB();
    this.VFRBS2 = this.ANP.add(this.FVB).add(this.FVBZ).multiply(Lohnsteuer2026.ZAHL100).subtract(this.VFRBS1);
}

/**
 * Tarifliche Einkommensteuer §32a EStG, PAP Seite 38
 */
Lohnsteuer2026.prototype.UPTAB26 = function() {
    if (this.X.compareTo(this.GFB.add(Lohnsteuer2026.ZAHL1)) == -1) {
        this.ST = BigDecimal.ZERO();
    } else {
        if (this.X.compareTo(BigDecimal.valueOf(17800)) == -1) {
            this.Y = this.X.subtract(this.GFB).divide(Lohnsteuer2026.ZAHL10000, 6, BigDecimal.ROUND_DOWN);
            this.RW = this.Y.multiply(BigDecimal.valueOf(914.51));
            this.RW = this.RW.add(BigDecimal.valueOf(1400));
            this.ST = this.RW.multiply(this.Y).setScale(0, BigDecimal.ROUND_DOWN);
        } else {
            if (this.X.compareTo(BigDecimal.valueOf(69879)) == -1) {
                this.Y = this.X.subtract(BigDecimal.valueOf(17799)).divide(Lohnsteuer2026.ZAHL10000, 6, BigDecimal.ROUND_DOWN);
                this.RW = this.Y.multiply(BigDecimal.valueOf(173.1));
                this.RW = this.RW.add(BigDecimal.valueOf(2397));
                this.RW = this.RW.multiply(this.Y);
                this.ST = this.RW.add(BigDecimal.valueOf(1034.87)).setScale(0, BigDecimal.ROUND_DOWN);
            } else {
                if (this.X.compareTo(BigDecimal.valueOf(277826)) == -1) {
                    this.ST = this.X.multiply(BigDecimal.valueOf(0.42)).subtract(BigDecimal.valueOf(11135.63)).setScale(0, BigDecimal.ROUND_DOWN);
                } else {
                    this.ST = this.X.multiply(BigDecimal.valueOf(0.45)).subtract(BigDecimal.valueOf(19470.38)).setScale(0, BigDecimal.ROUND_DOWN);
                }
            }
        }
    }
    this.ST = this.ST.multiply(BigDecimal.valueOf(this.KZTAB));
}
