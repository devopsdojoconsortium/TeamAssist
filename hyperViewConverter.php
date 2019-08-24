<?php
#!/usr/bin/php
echo "<pre>";

$url = $argv[1] ? $argv[1] : ($argv[0] && !preg_match("/converter/", $argv[0]) ? $argv[0] : "./test.html");
echo $url . "\n\n";
$html = join('', file($url));
# Create a DOM parser object
$dom = new DOMDocument();

# The @ before the method call suppresses any warnings that
# loadHTML might throw because of invalid HTML in the page.
## removed so HTML integrity can be checked as well.
$dom->loadHTML( $html);

# isolate to just the body tag.
$body = $dom->getElementsByTagName('body')->item(0);
echo dom_to_hcode($body);

echo "\n\n";

function dom_to_hcode($root) 
{ 
    static $depth = 0;
    $prt = array(); 
    $eltag = $root->nodeName;
    $atts = array();
    $str = array();


    if ($root->hasAttributes()) { 
        $attrs = $root->attributes; 

        foreach ($attrs as $i => $attr) {
            if($attr->name == 'id')
                $eltag .= "#" . $attr->value;
            elseif($attr->name == 'class')
                $classTag .= "." . preg_replace("/\s+/",".",$attr->value);
            elseif($attr->name == 'style')
                $styles = parse_styles($attr->value, ($depth + 1));
            else
                $atts[] = (preg_match("/-/", $attr->name) ? "'".$attr->name."'" : $attr->name)  
                    . ": " 
                    . (is_numeric($attr->value) ?  $attr->value : "'".$attr->value."'");
        }
        $eltag .= $classTag;
    }

    $children = $root->childNodes; 
    $chcnt = $children->length;

    if($eltag != "tddddbody"){
        $depth++;
        $prt[] = indent($depth) . "h('" . $eltag . "'";
        if($atts) 
            $prt[] = "{ \n".$styles.indent($depth + 1)."attrs: {".join(', ', $atts)."}\n".indent($depth)."}";
    }

    if($chcnt > 0){
        foreach($root->childNodes as $nc) {
            list($tag, $ttype, $val) =  array($nc->nodeName, $nc->nodeType, $nc->nodeValue);
            if(preg_match("/text/", $tag) && $ttype == XML_TEXT_NODE){
                if(trim($val) && $chcnt > 1)
                    $str[] = indent($depth + 1) . "'".trim($val)."'";
                elseif(trim($val))
                    $str[] =  "'".trim($val)."'";
                $string++;
            }        
            else
                $str[] = dom_to_hcode($nc);
        }
    }
    if($eltag == "tbsssody")
        return join(", ", $str) . ")";
    if($chcnt > 1 || ($chcnt && !$string))
        $prt[] = "[\n" . join(", \n", $str) . "\n" . indent($depth) . "]";
    elseif($chcnt)
        $prt[] = $str[0];
    $depth--;

    return join(", ", $prt) . ")";

}

function indent($amt, $mult=2, $str=""){
    return str_repeat(" ", $amt * $mult) . $str;
}

function parse_styles($val, $depth=1){
    $atts =  array();
    $styles = preg_split("/\s*;\s*/", $val);
    foreach($styles as $sty){
        list($k, $v) = preg_split("/\s*:\s*/", $sty);
        if($k && $v)
            $atts[] = "'$k': '$v'";
    }
    return indent($depth + 1)."style: {".join(', ', $atts)."},\n";
}

?>
