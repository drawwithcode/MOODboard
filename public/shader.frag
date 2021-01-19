

#ifdef GL_ES
precision mediump float;
#endif



uniform float time;
uniform float value;
uniform vec2 resolution;



#define RGB(r, g, b) vec3(r / 255.0, g / 255.0, b / 255.0)

const vec3 YELLOW = RGB(254.0, 190.0, 67.0);
const vec3 PINK = RGB(239.0, 108.0, 148.0);
const vec3 VIOLET = RGB(235.0, 154.0, 244.0);
const vec3 BLUE = RGB(83.0, 116.0, 231.0);
const vec3 WGREEN = RGB(216.0, 213.0, 85.0);
const vec3 CGREEN = RGB(117.0, 214.0, 144.0);
const vec3 GRAY = RGB(244.0, 244.0, 244.0);



vec3 band(vec2 pos) {
    float y = abs(pos.y) - 0.0;
    if (y <= 0.9) return YELLOW;
    if (y <= 0.9+0.8) return PINK;
    if (y <= 0.9+0.8+0.8) return BLUE;
    if (y <= 0.9+0.8+0.8+0.2) return VIOLET;
    if (y <= 0.9+0.8+0.4+0.2+0.8) return CGREEN;
    if (y <= 0.9+0.8+0.4+0.2+0.8+0.6) return WGREEN;
    if (y <= 0.9+0.8+0.4+0.2+0.8+0.6*10.) return GRAY;


}

void main() {


	//vec2 position = ( gl_FragCoord.xy / resolution.xy );
	vec2 position = (gl_FragCoord.xy / resolution.xy * 1.1) - vec2(0.0, 2.7);
	float X = position.x*20.;
	float Y = position.y*20.;
	float t = time*0.6;
	float o = sin(+cos(t+X/1.)+t+Y/6.-sin(X/(5.+cos(t*.1)-sin(X/10.+Y/10.))));
	//gl_FragColor = vec4( hsv2rgb(vec3( o*2, 1., .5)), 1. );



    gl_FragColor = vec4(band(position + vec2(0., cos(position.x*4. + o + time))), 4.0);
}
